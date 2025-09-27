const R_Mask = [0x1d5363d5, 0x415a0aac, 0x0000d2a8];
const Comp0 = [0x6aa97a30, 0x7942a809, 0x00003fea];
const Comp1 = [0xdd629e9a, 0xe3a21d63, 0x00003dd7];
const S_Mask0 = [0x9ffa7faf, 0xaf4a9381, 0x00005802];
const S_Mask1 = [0x4c8cb877, 0x4911b063, 0x0000c52b];

function sign({ uid, ts }) {
  const prefix = "FFFFFF";
  const rawKey = Buffer.from(prefix + uid, "hex");
  const rawIv = Buffer.from(ts, "hex");

  let key = []; // len 10
  let iv = []; // len 4
  let keystream = []; // len 16
  let key_size; /* Key size in bits. */
  let iv_size; /* IV size in bits. */
  let keystream_size; /* keystream size in bytes. */
  let R = []; // len 3
  let S = []; // len 3

  function CLOCK_R(input_bit, control_bit) {
    let Feedback_bit;
    /* r_79 ^ input bit */
    let Carry0, Carry1;
    /* Respectively, carry from R[0] into R[1] and carry from R[1] into R[2] */

    /* Initialise the variables */
    Feedback_bit = ((R[2] >>> 15) & 1) ^ input_bit;
    Carry0 = (R[0] >>> 31) & 1;
    Carry1 = (R[1] >>> 31) & 1;

    if (control_bit) {
      /* Shift and xor */
      R[0] ^= R[0] << 1;
      R[1] ^= (R[1] << 1) ^ Carry0;
      R[2] ^= (R[2] << 1) ^ Carry1;
    } else {
      /* Shift only */
      R[0] = R[0] << 1;
      R[1] = (R[1] << 1) ^ Carry0;
      R[2] = (R[2] << 1) ^ Carry1;
    }

    /* Implement feedback into the various register stages */
    if (Feedback_bit) {
      R[0] ^= R_Mask[0];
      R[1] ^= R_Mask[1];
      R[2] ^= R_Mask[2];
    }
  }

  function CLOCK_S(input_bit, control_bit) {
    let Feedback_bit;
    /* s_79 ^ input bit */
    let Carry0, Carry1;
    /* Respectively, carry from S[0] into S[1] and carry from S[1] into S[2] */

    /* Compute the feedback and two carry bits */
    Feedback_bit = ((S[2] >>> 15) & 1) ^ input_bit;
    Carry0 = (S[0] >>> 31) & 1;
    Carry1 = (S[1] >>> 31) & 1;

    /* Derive "s hat" according to the MICKEY v 0.4 specification */
    S[0] =
      (S[0] << 1) ^
      ((S[0] ^ Comp0[0]) &
        ((S[0] >>> 1) ^ (S[1] << 31) ^ Comp1[0]) &
        0xfffffffe);
    S[1] =
      (S[1] << 1) ^
      ((S[1] ^ Comp0[1]) & ((S[1] >>> 1) ^ (S[2] << 31) ^ Comp1[1])) ^
      Carry0;
    S[2] =
      (S[2] << 1) ^
      ((S[2] ^ Comp0[2]) & ((S[2] >>> 1) ^ Comp1[2]) & 0x7fff) ^
      Carry1;

    /* Apply suitable feedback from s_79 */
    if (Feedback_bit) {
      if (control_bit) {
        S[0] ^= S_Mask1[0];
        S[1] ^= S_Mask1[1];
        S[2] ^= S_Mask1[2];
      } else {
        S[0] ^= S_Mask0[0];
        S[1] ^= S_Mask0[1];
        S[2] ^= S_Mask0[2];
      }
    }
  }

  function CLOCK_KG(mixing, input_bit) {
    let Keystream_bit;
    /* Keystream bit to be returned (only valid if mixing = 0 and input_bit = 0 */
    let control_bit_r;
    /* The control bit for register R */
    let control_bit_s;
    /* The control bit for register S */

    Keystream_bit = (R[0] ^ S[0]) & 1;
    control_bit_r = ((S[0] >>> 27) ^ (R[1] >>> 21)) & 1;
    control_bit_s = ((S[1] >>> 21) ^ (R[0] >>> 26)) & 1;

    if (mixing) {
      CLOCK_R(((S[1] >>> 8) & 1) ^ input_bit, control_bit_r);
    } else {
      CLOCK_R(input_bit, control_bit_r);
    }
    CLOCK_S(input_bit, control_bit_s);

    return Keystream_bit;
  }

  function reverse_bit(x) {
    x = ((x & 0xaa) >>> 1) | ((x & 0x55) << 1);
    x = ((x & 0xcc) >>> 2) | ((x & 0x33) << 2);

    return (x >>> 4) | (x << 4);
  }

  function iv_setup({ rawKey, rawIv }) {
    let i;
    /* Counting/indexing variable */
    let iv_or_key_bit;
    /* Bit being loaded */
    /* Initialise R and S to all zeros */
    for (i = 0; i < 3; i++) {
      R[i] = 0;
      S[i] = 0;
    }

    for (
      i = 0;
      i < Math.floor(key_size / 8);
      i++ //strrev() in key
    ) {
      key[i] = reverse_bit(rawKey[9 - i]);
    }

    for (
      i = 0;
      i < Math.floor(iv_size / 8);
      i++ //strrev() in iv
    ) {
      iv[i] = reverse_bit(rawIv[3 - i]);
    }
    /* Load in IV */
    for (i = 0; i < iv_size; i++) {
      iv_or_key_bit =
        (iv[Math.floor(i / 8)] >>> (7 - (i % 8))) &
        1; /* Adopt usual, perverse, labelling order */
      CLOCK_KG(1, iv_or_key_bit);
    }

    /* Load in K */
    for (i = 0; i < key_size; i++) {
      iv_or_key_bit =
        (key[Math.floor(i / 8)] >>> (7 - (i % 8))) &
        1; /* Adopt usual, perverse, labelling order */
      CLOCK_KG(1, iv_or_key_bit);
    }

    /* Preclock */
    for (i = 0; i < key_size; i++) CLOCK_KG(1, 0);
  }

  function keystream_byte(len) {
    /* Counting variables */

    for (let i = 0; i < len; i++) {
      keystream[i] = 0;

      for (let j = 0; j < 8; j++) {
        keystream[i] ^= CLOCK_KG(0, 0) << (7 - j);
      }
    }
  }

  iv_size = 32;
  key_size = 80;
  keystream_size = 4;

  iv_setup({ rawKey, rawIv });
  keystream_byte(keystream_size);

  function toHex(arr) {
    let str = "";
    for (const c of arr) {
      str += ("00" + c.toString(16)).slice(-2);
    }
    return str;
  }

  return toHex(keystream);
}

module.exports.sign = sign;
