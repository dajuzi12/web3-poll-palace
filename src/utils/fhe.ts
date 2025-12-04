import { getAddress, hexlify } from 'ethers';

let fheInstance: any = null;

/**
 * Initialize FHE instance (singleton pattern)
 */
export async function initializeFHE(): Promise<any> {
  // Return existing instance if already initialized
  if (fheInstance) return fheInstance;

  // Environment check
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Ethereum provider not found. Please install MetaMask.');
  }

  try {
    console.log('[FHE] Loading SDK from CDN...');

    // Load SDK from CDN
    const sdk: any = await import(
      'https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js'
    );

    const { initSDK, createInstance, SepoliaConfig } = sdk;

    // Initialize WASM module
    await initSDK();

    // Create configuration
    const config = {
      ...SepoliaConfig,
      network: window.ethereum
    };

    // Create instance
    fheInstance = await createInstance(config);

    console.log('[FHE] ✅ Instance initialized successfully');
    return fheInstance;

  } catch (error) {
    console.error('[FHE] ❌ Initialization failed:', error);
    throw new Error(`FHE initialization failed: ${error}`);
  }
}

/**
 * Get FHE instance (without initialization)
 */
export function getFheInstance() {
  return fheInstance;
}

/**
 * Reset FHE instance (for testing)
 */
export function resetFheInstance() {
  fheInstance = null;
}

/**
 * Encrypt a single uint32 value
 * @param value - Value to encrypt
 * @param contractAddress - Target contract address (must be checksum)
 * @param userAddress - User address
 * @returns { handle, proof } - Encrypted handle and zero-knowledge proof
 */
export async function encryptUint32(
  value: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> {
  // Get FHE instance
  let fhe = getFheInstance();
  if (!fhe) {
    fhe = await initializeFHE();
  }
  if (!fhe) throw new Error('Failed to initialize FHE instance');

  // ⚠️ Critical: Address must comply with EIP-55 checksum
  const contractAddressChecksum = getAddress(contractAddress) as `0x${string}`;

  // Create encrypted input
  const ciphertext = await fhe.createEncryptedInput(
    contractAddressChecksum,
    userAddress
  );

  // Add 32-bit integer
  ciphertext.add32(value);

  // Encrypt and generate zero-knowledge proof
  const { handles, inputProof } = await ciphertext.encrypt();

  // Convert to hexadecimal string
  const handle = hexlify(handles[0]);
  const proof = hexlify(inputProof);

  return { handle, proof };
}

/**
 * Encrypt a vote choice
 * @param optionIndex - Vote option index
 * @param contractAddress - Contract address
 * @param userAddress - User address
 * @returns { handle, proof }
 */
export async function encryptVote(
  optionIndex: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> {
  const fhe = await initializeFHE();
  const contractAddressChecksum = getAddress(contractAddress) as `0x${string}`;

  const ciphertext = await fhe.createEncryptedInput(
    contractAddressChecksum,
    userAddress
  );
  ciphertext.add32(optionIndex); // uint32 is sufficient

  const { handles, inputProof } = await ciphertext.encrypt();

  return {
    handle: hexlify(handles[0]),
    proof: hexlify(inputProof)
  };
}

/**
 * Batch encrypt multiple values
 * @param values - Array of values to encrypt
 * @param contractAddress - Contract address
 * @param userAddress - User address
 * @returns { handles, proof }
 */
export async function encryptMultipleValues(
  values: number[],
  contractAddress: string,
  userAddress: string
): Promise<{ handles: string[]; proof: string }> {
  const fhe = await initializeFHE();
  const contractAddressChecksum = getAddress(contractAddress) as `0x${string}`;

  const ciphertext = await fhe.createEncryptedInput(
    contractAddressChecksum,
    userAddress
  );

  // Add multiple values
  for (const value of values) {
    ciphertext.add32(value);
  }

  // Encrypt (all values share one proof)
  const { handles, inputProof } = await ciphertext.encrypt();

  // Convert all handles
  const hexHandles = handles.map((h: any) => hexlify(h));
  const proof = hexlify(inputProof);

  return { handles: hexHandles, proof };
}
