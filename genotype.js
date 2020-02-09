const ut = require('./utils');
const nt = require('./network');

function getActivationFunction(activationFunctionList) {
    return activationFunctionList[ut.getRandomInt(0, activationFunctionList.length)];
}

function getLink(linkGenes, sourceNeuron, targetNeuron) {
    const findLink = (linkGene) => linkGene.source.id === sourceNeuron.id && linkGene.target.id === targetNeuron.id;
    const index = linkGenes.findIndex(findLink);

    let link = null;

    if(index !== -1) {
        link = linkGenes[index];
    }

    return link;
}

function getLinkInnovation(linkGenes, counters, sourceNeuron, targetNeuron) {
    const link = getLink(linkGenes, sourceNeuron, targetNeuron);

    let innovation = 0;

    if(link === null) {
        counters.innovation++;
        innovation = counters.innovation;
    }
    else {
        innovation = link.innovation;
    }

    return innovation;
}

function addLinkToNetwork(linkGenes, counters, network, sourceNeuron, targetNeuron) {
    const innovation = getLinkInnovation(linkGenes, counters, sourceNeuron, targetNeuron);
    const newLink = nt.createLink(sourceNeuron, targetNeuron, ut.getRandomFloat(-1, 1), innovation, true);

    network.addLink(newLink);

    return [newLink];
}

function addNeuronToNetwork(counters, activtionFunctionList, network, sourceNeuron, targetNeuron) {
    counters.neuronId++;

    const activationFunction = getActivationFunction(activtionFunctionList);
    const newNeuron = nt.createNeuron(counters.neuronId, activationFunction, true);

    const oldLink = network.getLink(sourceNeuron, targetNeuron);

    counters.innovation++;
    const inputInnovation = counters.innovation;
    const inputLink = nt.createLink(sourceNeuron, newNeuron, (oldLink !== null ? oldLink.weight : 1), inputInnovation, true)

    counters.innovation++;
    const outputInnovation = counters.innovation;
    const outputLink = nt.createLink(newNeuron, targetNeuron, 1.0, outputInnovation, true);

    if(oldLink !== null) {
        oldLink.disable();
    }

    network.addNeuron(newNeuron);
    network.addLink(inputLink);
    network.addLink(outputLink);

    return [inputLink, outputLink];
}

function crossGenotypes(genotypes) {
    const newGenotype = [];

    for(let i = 0; i < genotypes[0].length; i++) {
        const genes = [];

        for(let j = 0; j < genotypes.length; j++) {
            if(genotypes[j][i] !== null) {
                genes.push(genotypes[j][i]);
            }
        }

        if(genes.length > 0) {
            const choosenGeneIndex = ut.getRandomInt(0, genes.length);
            const choosenGene      = genes[choosenGeneIndex];

            const newGene = nt.createLink(choosenGene.source, choosenGene.target, choosenGene.weight, choosenGene.innovation, choosenGene.active);

            newGenotype.push(newGene);
        }
    }

    return newGenotype;
}

function propagateDepth(source, links, neurons) {
    for(let i = 0; i < links.length; i++) {
        if(source.id === links[i].source.id) {
            let j = 0;

            while(links[i].target.id !== neurons[j].id) {
                j++;
            }

            const target = neurons[j];

            if(source.depth >= target.depth) {
                target.depth = source.depth + 1;
                propagateDepth(target, links, neurons);
            }
        }
    }
}

function getGenotypeNeurons(genotype) {
    const neurons = [];
    const visitedGenes = [];

    for(let i = 0; i < genotype.length; i++) {
        const link = genotype[i];

        let j = 0;
        while(j < neurons.length && neurons[j].id !== link.source.id) {
            j++;
        }

        if(j === neurons.length) {
            if(link.source.depth === 0) {
                const newSource = nt.createInputNeuron(link.source.id);
                link.source = newSource;
            }
            else {
                const newSource = nt.createNeuron(link.source.id, link.source.activationFunction, link.source.mutable);
                link.source = newSource;
            }

            neurons.push(link.source);
        }
        else {
            link.source = neurons[j];
        }

        const source = neurons[j];

        j = 0;
        while(j < neurons.length && neurons[j].id !== link.target.id) {
            j++;
        }

        if(j === neurons.length) {
            const newTarget = nt.createNeuron(link.target.id, link.target.activationFunction, link.target.mutable);
            link.target = newTarget;
            neurons.push(link.target);

            neurons[j].depth = source.depth + 1;
            neurons[j].inputLinks.push(link);
        }
        else {
            link.target = neurons[j];

            if(neurons[j].depth <= source.depth) {
                neurons[j].depth = source.depth + 1;
            }

            neurons[j].inputLinks.push(link);

            propagateDepth(neurons[j], visitedGenes, neurons);
        }

        visitedGenes.push(link);
    }

    return neurons;
}

module.exports = {
    getActivationFunction,
    getLink,
    getLinkInnovation,
    addLinkToNetwork,
    addNeuronToNetwork,
    crossGenotypes,
    getGenotypeNeurons
}