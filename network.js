const ut = require('./utils');

const emptyInputNeuron = {
    id:          0,
    depth:       0,
    outputReady: undefined,
    output:      0.0,
    mutable:     undefined
};

const inputNeuronPrototype = {
    setOutput: function(input) {
        this.output      = input;
        this.outputReady = true;
    },

    reset: function() {
        this.depth       = 0;
        this.output      = 0.0;
        this.outputReady = false;
    }
};

function createInputNeuron(id) {
    const newInputNeuron = Object.assign(Object.create(inputNeuronPrototype), emptyInputNeuron);

    newInputNeuron.id          = id;
    newInputNeuron.depth       = 0;
    newInputNeuron.outputReady = false;
    newInputNeuron.output      = 0.0;
    newInputNeuron.mutable     = false;

    return newInputNeuron;
}

const emptyNeuron = {
    id:                 0,
    depth:              0,
    activationFunction: undefined,
    inputLinks:         undefined,
    outputReady:        undefined,
    output:             0.0,
    mutable:            undefined
};

const neuronPrototype = {
    setOutput: function() {
        let sumInputs = 0.0;

        for(let i = 0; i < this.inputLinks.length; i++) {
            if(this.inputLinks[i].active) {
                if(this.inputLinks[i].source.outputReady === false) {
                    this.inputLinks[i].source.setOutput();
                }

                sumInputs += this.inputLinks[i].source.output * this.inputLinks[i].weight;
            }
        }

        this.output      = this.activationFunction(sumInputs);
        this.outputReady = true;
    },

    setActivationFunction: function(activationFunction) {
        this.activationFunction = activationFunction;
    },

    reset: function() {
        this.depth       = 0;
        this.output      = 0.0;
        this.outputReady = false;
        this.inputLinks  = [];
    },

    addInputLink: function(inputLink) {
        if(this.depth <= inputLink.source.depth) {
            this.depth = inputLink.source.depth + 1;
        }

        this.inputLinks.push(inputLink);
    },

    mutate: function(activationFunction) {
        if(this.mutable) {
            this.activationFunction = activationFunction;
        }
    }
};

function createNeuron(id, activationFunction, mutable) {
    const newNeuron = Object.assign(Object.create(neuronPrototype), emptyNeuron);

    newNeuron.id                 = id;
    newNeuron.depth              = 0;
    newNeuron.activationFunction = activationFunction;
    newNeuron.inputLinks         = [];
    newNeuron.outputReady        = false;
    newNeuron.output             = 0.0;
    newNeuron.mutable            = mutable;

    return newNeuron;
};

const emptyLink = {
    source:     undefined,
    target:     undefined,
    weight:     0.0,
    innovation: 0,
    active:     undefined
};

const linkPrototype = {
    disable: function() {
        this.active = false;
    },

    enable: function() {
        this.active = true;
    },

    mutate: function() {
        this.weight += ut.getRandomFloat(-0.1, 0.1)
    }
};

function createLink(source, target, weight, innovation, active) {
    const newLink = Object.assign(Object.create(linkPrototype), emptyLink);

    newLink.source     = source;
    newLink.target     = target;
    newLink.weight     = weight;
    newLink.innovation = innovation;
    newLink.active     = active;

    return newLink;
};

const emptyNetwork = {
    inputNeuronsNumber:  0,
    outputNeuronsNumber: 0,
    neurons:             [],
    links:               []
};

const networkPrototype = {
    control: function() {
        for(let i = 0; i < this.links.length; i++) {

            let j = 0;
            while(j < this.neurons.length && this.neurons[j] !== this.links[i].source) {
                j++
            }

            if(j === this.neurons.length) {
                console.log("Link " + this.links[i].innovation + " : missing source");
            }

            j = 0;
            while(j < this.neurons.length && this.neurons[j] !== this.links[i].target) {
                j++
            }

            if(j === this.neurons.length) {
                console.log("Link " + i + " : missing target");
            }
        }

        for(let i = 0; i < this.neurons.length; i++) {
            if(this.neurons[i].depth > 0) {
                for(let j = 0; j < this.neurons[i].inputLinks.length; j++) {
                    if(this.neurons[i] !== this.neurons[i].inputLinks[j].target) {
                        console.log("Neuron " + this.neurons[i].id + " : wrong link " + this.links[j].innovation);
                    }
                }
            }
        }
    },

    calculateOutputs: function(inputs) {
        let inputNeuronOutputSet = 0;
        let i = 0;

        while(inputNeuronOutputSet < this.inputNeuronsNumber) {
            if(this.neurons[i].depth === 0) {
                this.neurons[i].setOutput(inputs[inputNeuronOutputSet]);
                inputNeuronOutputSet++;
            }

            i++
        }

        for(let i = 0; i < this.neurons.length; i++) {
            if(this.neurons[i].depth !== 0) {
                this.neurons[i].setOutput();
            }
        }

        const outputs = [];

        let outputCollected = 0;
        i = 0;

        while(outputCollected < this.outputNeuronsNumber) {
            if(this.neurons[i].depth > 0 && this.neurons[i].mutable === false) {
                outputs.push(this.neurons[i].output);
                outputCollected++;
            }

            i++;
        }

        return outputs;
    },

    addNeuron: function(neuron) {
        this.neurons.push(neuron);
    },

    getSourceNeuron: function() {
        const potentialSources = [];

        for(let i = 0; i < this.neurons.length; i++) {
            if(this.neurons[i].depth === 0 || (this.neurons[i].depth > 0 && this.neurons[i].mutable === true)) {
                potentialSources.push(this.neurons[i]);
            }
        }

        const sourceIndex  = ut.getRandomInt(0, potentialSources.length);
        const sourceNeuron = potentialSources[sourceIndex];

        return sourceNeuron;
    },

    getTargetNeuron: function(sourceNeuron) {
        const potentialTargets = [];

        for(let i = 0; i < this.neurons.length; i++) {
            if(this.neurons[i] !== sourceNeuron && this.neurons[i].depth > 0 && this.neurons[i].depth >= sourceNeuron.depth) {
                potentialTargets.push(this.neurons[i]);
            }
        }

        const targetIndex  = ut.getRandomInt(0, potentialTargets.length);
        const targetNeuron = potentialTargets[targetIndex];

        return targetNeuron;
    },

    getNeuronToAddPosition: function() {
        const sourceAndTarget = [];

        const sourceNeuron = this.getSourceNeuron();
        const targetNeuron = this.getTargetNeuron(sourceNeuron);

        sourceAndTarget.push(sourceNeuron);
        sourceAndTarget.push(targetNeuron);

        return sourceAndTarget;
    },

    getLink: function(sourceNeuron, targetNeuron) {
        let link  = null;
        let index = 0;

        while(index < this.links.length && (this.links[index].source !== sourceNeuron || this.links[index].target !== targetNeuron)) {
            index++;
        }

        if(index < this.links.length) {
            link = this.links[index];
        }

        return link;
    },

    addLink: function(link) {
        this.links.push(link);
        link.target.addInputLink(link);
        this.propagateDepth(link.target);
    },

    getLinkToAdd: function() {
        const linkNodes = [];

        const sourceNeuron = this.getSourceNeuron();
        const targetNeuron = this.getTargetNeuron(sourceNeuron);

        const link = this.getLink(sourceNeuron, targetNeuron);

        if(link === null) {
            linkNodes.push(sourceNeuron);
            linkNodes.push(targetNeuron);
        }
        else {
            link.enable();
        }

        return linkNodes;
    },

    getGenotype: function(innovationCounter) {
        const genotype = new Array(innovationCounter);

        genotype.fill(null);

        for(let i = 0; i < this.links.length; i++) {
            genotype[this.links[i].innovation - 1] = this.links[i];
        }

        return genotype;
    },

    propagateDepth: function(source) {
        for(let i = 0; i < this.links.length; i++) {
            const link = this.links[i];

            if(link.source === source) {
                if(link.target.depth <= source.depth) {
                    link.target.depth = source.depth + 1;

                    this.propagateDepth(link.target);
                }
            }
        }
    }
};

function createNetwork(inputNeuronsNumber, outputNeuronsNumber, neurons, links) {
    const newNetwork = Object.assign(Object.create(networkPrototype), emptyNetwork);

    newNetwork.inputNeuronsNumber  = inputNeuronsNumber;
    newNetwork.outputNeuronsNumber = outputNeuronsNumber;

    newNetwork.neurons = [];
    for(let i = 0; i < neurons.length; i++) {
        newNetwork.neurons.push(neurons[i]);
    }

    newNetwork.links = [];
    for(let i = 0; i < links.length; i++) {
        newNetwork.links.push(links[i]);
    }

    return newNetwork;
};

module.exports = {
    createInputNeuron,
    createNeuron,
    createLink,
    createNetwork
}