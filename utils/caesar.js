// utils/caesar.js
/**
 * Simple Caesar Cipher for password encryption/decryption
 * Not strong cryptography — just what your system requires
 */

const SHIFT = 5; // can be moved to .env if you want dynamic shift

function encrypt(text) {
  return text
    .split("")
    .map((c) => String.fromCharCode(c.charCodeAt(0) + SHIFT))
    .join("");
}

function decrypt(text) {
  return text
    .split("")
    .map((c) => String.fromCharCode(c.charCodeAt(0) - SHIFT))
    .join("");
}

module.exports = { encrypt, decrypt };
