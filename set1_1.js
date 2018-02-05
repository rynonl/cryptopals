const hexToBase64 = (hexString) => {
  const bytes = new Buffer(hexString, 'hex')
  return bytes.toString('base64')
}

// console.log(hexToBase64('49276d206b696c6c696e6720796f757220627261696e206c696b65206120706f69736f6e6f7573206d757368726f6f6d'))

const xor = (bytes1, bytes2) => {
  const out = []
  for (let i = 0; i < bytes1.length; i++) {
    out.push(bytes1[i] ^ bytes2[i])
  }
  return new Buffer(out)
}


// console.log(xor(new Buffer('1c0111001f010100061a024b53535009181c', 'hex'), new Buffer('686974207468652062756c6c277320657965', 'hex')).toString())

const singleByteXORCypher = (bytes) => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  const alpabetRegex = new RegExp(`\\s[${alphabet}]`, 'g')

  const score = (str) =>  {
    match = str.match(alpabetRegex)
    if (match) {
      return match.length
    } else {
      return -100
    }
  }

  let chars = []
  for (let i = 0; i < 256; i++) {
    chars.push(String.fromCharCode(i))
  }

  const scores = chars.map(ch => {
    const chArr = Array(bytes.length).fill(ch)
    const cypher = new Buffer(chArr.join(''))

    const out = xor(bytes, cypher)
    const humanStr = out.toString()
    return { character: ch, score: score(humanStr), str: humanStr, hex: bytes.toString('hex') }
  })

  return scores.reduce((a, b) => { return a.score > b.score ? a : b })
}

// console.log(singleByteXORCypher(new Buffer('1b37373331363f78151b7f2b783431333d78397828372d363c78373e783a393b3736', 'hex')))

const detectSingleByteXOR = (hexStrings) => {
  const topScores = hexStrings.map(hex => singleByteXORCypher(new Buffer(hex, 'hex')))//.sort((a, b) => b.score - a.score)

  return topScores.reduce((a, b) => { return a.score > b.score ? a : b })
}

const test_detectSingleByteXOR = () => {
  const lines = require('fs').readFileSync('data/s1c4.txt', 'utf8').split('\n')
  return detectSingleByteXOR(lines)
}

// console.log(test_detectSingleByteXOR())
