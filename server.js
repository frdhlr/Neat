const http     = require('http');
const socketio = require('socket.io');

const nt = require('./network');
const fn = require('./activationFunctions.js');
const gn = require('./genotype.js');
const ut = require('./utils');

const port   = process.env.PORT || 8080;
const server = http.createServer();
const io     = socketio(server);

function initNetworks() {
    const networks = [];

    for(let i = 0; i < 15; i++) {
        const neuron1 = nt.createInputNeuron(1);
        const neuron2 = nt.createInputNeuron(2);
        const neuron3 = nt.createInputNeuron(3);
        const neuron4 = nt.createNeuron(4, fn.tanh, false);
        const neuron5 = nt.createNeuron(5, fn.tanh, false);
        const neuron6 = nt.createNeuron(6, fn.tanh, false);
        const neuron7 = nt.createNeuron(7, fn.tanh, false);

        const link1  = nt.createLink(neuron1, neuron4, ut.getRandomFloat(-1.0, 1.0), 1, true);
        const link2  = nt.createLink(neuron2, neuron4, ut.getRandomFloat(-1.0, 1.0), 2, true);
        const link3  = nt.createLink(neuron3, neuron4, ut.getRandomFloat(-1.0, 1.0), 3, true);

        neuron4.addInputLink(link1);
        neuron4.addInputLink(link2);
        neuron4.addInputLink(link3);

        const link4  = nt.createLink(neuron1, neuron5, ut.getRandomFloat(-1.0, 1.0), 4, true);
        const link5  = nt.createLink(neuron2, neuron5, ut.getRandomFloat(-1.0, 1.0), 5, true);
        const link6  = nt.createLink(neuron3, neuron5, ut.getRandomFloat(-1.0, 1.0), 6, true);

        neuron5.addInputLink(link4);
        neuron5.addInputLink(link5);
        neuron5.addInputLink(link6);

        const link7  = nt.createLink(neuron1, neuron6, ut.getRandomFloat(-1.0, 1.0), 7, true);
        const link8  = nt.createLink(neuron2, neuron6, ut.getRandomFloat(-1.0, 1.0), 8, true);
        const link9  = nt.createLink(neuron3, neuron6, ut.getRandomFloat(-1.0, 1.0), 9, true);

        neuron6.addInputLink(link7);
        neuron6.addInputLink(link8);
        neuron6.addInputLink(link9);

        const link10 = nt.createLink(neuron1, neuron7, ut.getRandomFloat(-1.0, 1.0), 10, true);
        const link11 = nt.createLink(neuron2, neuron7, ut.getRandomFloat(-1.0, 1.0), 11, true);
        const link12 = nt.createLink(neuron3, neuron7, ut.getRandomFloat(-1.0, 1.0), 12, true);

        neuron7.addInputLink(link10);
        neuron7.addInputLink(link11);
        neuron7.addInputLink(link12);

        const neurons = [neuron1, neuron2, neuron3, neuron4, neuron5, neuron6, neuron7];
        const links   = [link1, link2, link3, link4, link5, link6, link7, link8, link9, link10, link11, link12];
        const network = nt.createNetwork(3, 4, neurons, links);

        networks.push(network);
    }

    return networks;
}

function addNewGenes(geneList, newGenes) {
    for(let i = 0; i < newGenes.length; i++) {
        geneList.push(newGenes[i]);
    }

    return geneList;
}

function generateImage(network) {
    const image = new Array(120);

    for(let j = 0; j < 120; j++) {
        image[j] = new Array(80);

        for(let k = 0; k < 80; k++) {
            const x = (k - 40) / 40;
            const y = (j - 60) / 60;
            const d = Math.sqrt((x * x) + (y * y)) / Math.sqrt(2);

            const outputs = network.calculateOutputs([x, y, d]);
            image[j][k] = outputs.map(x => (x * 127.5) + 127.5);
        }
    }

    return image;
}

server.listen(port, () => {
    console.log('');
    console.log(`> Running socket on port: ${port}`);
    console.log('>> Waiting for connection...')
});

io.on('connection', (socket) => {
    const networks = initNetworks();

    let innovation = networks[0].links.length;
    let neuronId   = networks[0].neurons.length;

    const counters = {innovation: innovation,
                      neuronId:   neuronId};

    socket.on('generate', async () => {
        console.log(">>> Generation started...");

        const imageArray = [];

        for(let i = 0; i < 15; i++) {
            const image = generateImage(networks[i]);

            imageArray.push(image);
        }

        io.emit('imageGenerated', imageArray);
        console.log(">>> Generation completed...");
    });

    socket.on('mutate', (selectedImages) => {
        console.log(">>> Mutation started...");

        const selectedNetworks = [];

        for(let i = 0; i < selectedImages.length; i++) {
            selectedNetworks.push(networks[selectedImages[i]]);
        }

        const newNetworks = [];

        // for(let i = 0; i < selectedNetworks.length - 1; i++){
        for(let i = 0; i < selectedNetworks.length; i++){
            // for(let j = i + 1; j < selectedNetworks.length; j++) {
            for(let j = i; j < selectedNetworks.length; j++) {
                const newLinks   = gn.crossGenotypes([selectedNetworks[i].getGenotype(counters.innovation), selectedNetworks[j].getGenotype(counters.innovation)]);
                const newNeurons = gn.getGenotypeNeurons(newLinks);

                newNetworks.push(nt.createNetwork(selectedNetworks[i].inputNeuronsNumber, selectedNetworks[i].outputNeuronsNumber, newNeurons, newLinks));
            }
        }

        const geneList = [];

        for(let i = 0; i < networks.length; i++) {
            networks[i] = newNetworks[i];

            for(let j = 0; j < networks[i].links.length; j++) {
                geneList.push(networks[i].links[j]);

                if(ut.getRandomFloat(0, 100) <= 10.0) {
                    console.log("Mutation: link changed!");
                    networks[i].links[j].mutate();
                }
            }

            for(let j = 0; j < networks[i].neurons.length; j++) {
                if(networks[i].neurons[j].depth > 0 && ut.getRandomFloat(0, 100) <= 5.0) {
                    console.log("Mutation: neuron changed!");
                    const newActivationFunction = fn.activationFunctionList[ut.getRandomInt(0, fn.activationFunctionList.length)];
                    networks[i].neurons[j].mutate(newActivationFunction);
                }
            }

            if(ut.getRandomFloat(0, 100) <= 5.0) {
                console.log("Mutation: neuron added!");
                const sourceTarget = networks[i].getNeuronToAddPosition();

                if(sourceTarget.length > 0) {
                    const newGenes = gn.addNeuronToNetwork(counters, fn.activationFunctionList, networks[i], sourceTarget[0], sourceTarget[1]);

                    addNewGenes(geneList, newGenes);
                }
            }

            if(ut.getRandomFloat(0, 100) <= 10.0) {
                console.log("Mutation: link added!");
                const sourceTarget = networks[i].getLinkToAdd();

                if(sourceTarget.length > 0) {
                    const newGenes = gn.addLinkToNetwork(geneList, counters, networks[i], sourceTarget[0], sourceTarget[1]);

                    addNewGenes(geneList, newGenes);
                }
            }
        }

        const imageArray = [];

        for(let i = 0; i < 15; i++) {
            const image = generateImage(networks[i]);

            imageArray.push(image);
        }

        io.emit('imageGenerated', imageArray);
        console.log(">>> Mutation completed...");
    });
});
