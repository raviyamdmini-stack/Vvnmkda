const PAIRS = {};

function setPair(num, code) {
  PAIRS[num] = code;
}

function getPair(num) {
  return PAIRS[num] || null;
}

module.exports = { setPair, getPair };