import React, { useState, useEffect } from "react";
import { Connection, PublicKey, clusterApiUrl, Transaction, SystemProgram, Keypair, sendAndConfirmTransaction , TransactionInstruction} from "@solana/web3.js";
import { Buffer } from "buffer";
const CounterApp = () => {
  const [message, setMessage] = useState("");
  const [counter, setCounter] = useState(null);
  const [counterAccountPublicKey, setCounterAccountPublicKey] = useState(null);
  const [counterAccountKeypair, setCounterAccountKeypair] = useState(null);

  const programId = new PublicKey("DYP4W6vLdjh3yJeYcJUvRQCnS9qqQxTaSS5F6QHFupw4");
  const network = clusterApiUrl("devnet");
  const connection = new Connection(network, "confirmed");

  useEffect(() => {
    const newKeypair = Keypair.generate();
    setCounterAccountKeypair(newKeypair);
    setCounterAccountPublicKey(newKeypair.publicKey);
    console.log("Counter Account Public Key:", newKeypair.publicKey.toString());
  }, []);
// setCounterAccountPublicKey()

  const createCounterAccount = async () => {
    const provider = window.solana;

    if (!provider || !provider.isPhantom) {
      setMessage("Please install and connect to the Phantom wallet.");
      return;
    }

    try {
      await provider.connect();
    } catch (err) {
      console.error("Error connecting to Phantom wallet:", err);
      setMessage("Failed to connect to Phantom wallet. Please try again.");
      return;
    }

    const walletPublicKey = provider.publicKey;
    console.log("Wallet Public Key:", walletPublicKey.toString());

    if (!counterAccountKeypair) {
      setMessage("Counter account keypair is not set. Please refresh the page.");
      return;
    }

    try {
      const accountInfo = await connection.getAccountInfo(counterAccountKeypair.publicKey);

      if (accountInfo === null) {
        const transaction = new Transaction();
        const space = 4; // Increase space to 4 bytes for a u32 counter
        const lamports = await connection.getMinimumBalanceForRentExemption(space);

        transaction.add(
          SystemProgram.createAccount({
            fromPubkey: walletPublicKey,
            newAccountPubkey: counterAccountKeypair.publicKey,
            lamports: lamports,
            space: space,
            programId: programId,
          })
        );

        const { blockhash } = await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = walletPublicKey;

        try {
          const signedTransaction = await provider.signTransaction(transaction);
          signedTransaction.partialSign(counterAccountKeypair);
          
          const rawTransaction = signedTransaction.serialize();
          const signature = await connection.sendRawTransaction(rawTransaction);
          
          console.log("Transaction sent:", signature);
          console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);

          await connection.confirmTransaction(signature, "confirmed");
          console.log("Transaction confirmed");

          setMessage("Counter account created successfully!");
        } catch (signError) {
          console.error("Error in transaction process:", signError);
          setMessage(`Failed in transaction process: ${signError.message}`);
        }
      } else {
        setMessage("Counter account already exists.");
      }
    } catch (error) {
      console.error("Error creating counter account:", error);
      setMessage(`Failed to create counter account: ${error.message}`);
    }
  };

  const incrementCounter = async () => {
    try {
      const provider = window.solana;
      await provider.connect();
      const walletPublicKey = provider.publicKey;

      const instruction = new TransactionInstruction({
        keys: [{ pubkey: counterAccountPublicKey, isSigner: false, isWritable: true }],
        programId: programId,
        data: Buffer.alloc(0), // No additional data is passed
      });

      const transaction = new Transaction().add(instruction);

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletPublicKey;

      const signedTransaction = await provider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature, "confirmed");

      setMessage("Counter incremented successfully!");
      fetchCounterValue();
    } catch (error) {
      console.error("Error incrementing counter:", error);
      setMessage("Failed to increment counter. See console for details.");
    }
  };

  // Function to fetch the current counter value
  const fetchCounterValue = async () => {
    try {
      const accountInfo = await connection.getAccountInfo(counterAccountPublicKey);
      if (accountInfo !== null) {
        const counterValue = accountInfo.data[0]; // First byte contains the counter
        setCounter(counterValue);
      }
    } catch (error) {
      console.error("Error fetching counter value:", error);
      setMessage("Failed to fetch counter value. See console for details.");
    }
  };


  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
    <h2>Solana Counter Program</h2>
    <button onClick={createCounterAccount} style={{ padding: "10px 20px", fontSize: "16px" }}>
      Create Counter Account
    </button>
    <br /><br />
    <button onClick={incrementCounter} style={{ padding: "10px 20px", fontSize: "16px" }}>
      Increment Counter
    </button>
    <br /><br />
    <button onClick={fetchCounterValue} style={{ padding: "10px 20px", fontSize: "16px" }}>
      Fetch Counter Value
    </button>
    {message && <p>{message}</p>}
    {counter !== null && <p>Current Counter Value: {counter}</p>}
  </div>
  );
};

export default CounterApp;