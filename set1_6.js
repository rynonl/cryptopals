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

var alphabet = 'abcdefghijklmnopqrstuvwxyz'
var alphabetBuffer = Buffer.concat([
  new Buffer(alphabet),
  new Buffer(alphabet.toUpperCase()),
  new Buffer(' ')
])

// returns a length-normalized score of alphabetical characters or spaces
// adapted from set1/challenge4
const score = input => {
  var score = 0

  for (var i = 0; i < input.length; i++) {
    score += alphabetBuffer.indexOf(input[i]) > -1
  }

  return score / input.length
}

let chars = []
for (let i = 0; i < 256; i++) {
  chars.push(i)
}

const singleByteXORCypher = (bytes) => {
  const scores = chars.map(ch => {
    const chArr = Array(bytes.length).fill(ch)
    const cypher = new Buffer(chArr)

    const out = xor(bytes, cypher)
    const humanStr = out.toString()
    return { character: ch, score: score(out), str: humanStr, hex: bytes.toString('hex') }
  })

  return scores.reduce((a, b) => { return a.score > b.score ? a : b })
}
// console.log(singleByteXORCypher(new Buffer('1b37373331363f78151b7f2b783431333d78397828372d363c78373e783a393b3736', 'hex')))

const rotEncrypt = (valueBuf, keyBuf) => {
  let fullKey = []
  for (let i = 0; i < valueBuf.length; i++) {
    fullKey.push(keyBuf[i % keyBuf.length])
  }

  return xor(valueBuf, Buffer.from(fullKey))
}
// console.log(rotEncrypt(new Buffer('Burning \'em, if you ain\'t quick and nimble\nI go crazy when I hear a cymbal'), new Buffer('ICE')).toString('hex'))

// 6

const hamming = (a, b) => {
  if (typeof a === 'string') {
    a = new Buffer(a)
    b = new Buffer(b)
  }

  let distance = 0
  let diff = xor(a, b)
  const max = Math.max(a.length, b.length)

  diff.forEach(byte => {
    for (let i = 0; i < 8; i++) {
      if ((byte & 1) === 1) {
        distance++
      }
     
      byte = byte >>> 1
    }
  })

  return distance
}
// console.log(hamming('this is a test', 'wokka wokka!!!')) // 37

const detectKeySizes = (encrypted, num) => {
  const keySizes = Array.from({length: 39}, (x, i) => i + 2); // [2, .., 40]
  const allKeySizes = keySizes.map(size => {
    const iters = encrypted.length / size - size

    if (iters < 2) {
      return Infinity
    }
    // console.log(encrypted.slice(0, size))
    // console.log(encrypted.slice(size, size * 2))
    let total = 0;
    for (let i = 0; i < iters; i++) {
      total += hamming(encrypted.slice(i * size, i * size + size), encrypted.slice(i * size + size, i * size + (2 * size)))
    }
    return { size: size, score: total / iters / size }
  })

  // console.log(allKeySizes)
  
  let candidateKeySizes = []
  allKeySizes.forEach(cur => {
    if (candidateKeySizes.length < num) {
      candidateKeySizes.push(cur)
    } else {
      const max = candidateKeySizes.reduce((a, b) => { return a.score > b.score ? a : b })
      if (cur.score < max.score) {
        candidateKeySizes[candidateKeySizes.indexOf(max)] = cur
      }
    }
  })

  // console.log(candidateKeySizes)
  return candidateKeySizes
}

const slice = (encrypted, size) => {
  let blocks = []
  for (let i = 0; i < encrypted.length; i += size) {
    blocks.push(encrypted.slice(i, i + size))
  }
  return blocks
}

const transpose = (blocks) => {
  let transposed = [];
  const blockLength = blocks[0].length

  for (let i = 0; i < blockLength; i++) {
    let block = []
    
    for (let b = 0; b < blocks.length; b++) {
      block.push(blocks[b][i])
    }

    transposed.push(Buffer.from(block))
  }

  return transposed
}

const decryptRotCypher = (encrypted) => {
  const keySizes = detectKeySizes(encrypted, 1)

  return keySizes.sort((a, b) => a.score - b.score).map(keySize => {
    const blocks = slice(encrypted, keySize.size) // #5
    const transposed = transpose(blocks) // #6

    let key = [];
    for (let i = 0; i < transposed.length; i++) {
      key.push(singleByteXORCypher(transposed[i]).character)
    }

    return Buffer.from(key)
  })

}

const test_decryptRotCypher = () => {
  const file = require('fs').readFileSync('data/s1c6.txt', 'utf-8')
  const fileBuf = new Buffer(file, 'base64')
  const key = decryptRotCypher(fileBuf)[0]
  console.log(key.toString())
  console.log(rotEncrypt(fileBuf, key).toString())
}
// test_decryptRotCypher()
