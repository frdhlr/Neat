const sigmoid = function(x) {
    return 1.0 / (1.0 + Math.exp(-x));
};

const tanh = function(x) {
    return (2.0 / (1.0 + Math.exp(-2.0 * x))) - 1.0;
};

const identity = function(x) {
    return x;
};

const cos = function(x) {
    return Math.cos(x * Math.PI);
};

const sin = function(x) {
    return Math.sin(x * Math.PI);
};

const activationFunctionList = [
    sigmoid,
    tanh,
    identity,
    cos,
    sin
];

module.exports = {
    tanh,
    activationFunctionList
}