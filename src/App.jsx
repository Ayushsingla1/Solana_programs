import React, { useState } from "react";
import { Connection, PublicKey, clusterApiUrl, Transaction, TransactionInstruction } from "@solana/web3.js";
import { Buffer } from "buffer"; 

const HelloSolana = () => {
  const [message, setMessage] = useState("");

  const programId = new PublicKey("CvMUEgEUUiPevo6v8UYNMs7jdahdowAS5ogvNReB4gtx"); 
  const connection = new Connection(clusterApiUrl("devnet"));

  const callHelloSolana = async () => {
    try {
      const provider = window.solana;
      if (!provider) throw new Error("Solana wallet not found!");
      await provider.connect();

      const walletPublicKey = provider.publicKey;
      const { blockhash } = await connection.getLatestBlockhash("confirmed");


      const instruction = new TransactionInstruction({
        keys: [],
        programId: programId,
        data: Buffer.alloc(0),
      });
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: walletPublicKey,
      }).add(instruction);

      // Sign and send the transaction
      const signedTransaction = await provider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      const explorerLink = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
      console.log(explorerLink)

      await connection.confirmTransaction(signature, "confirmed");
      setMessage("Transaction successful! Check logs in Solana Explorer.");
      
    } catch (error) {
      console.error("Error:", error);
      setMessage("Transaction failed. See console for details.");
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Call Solana Smart Contract</h2>
      <button onClick={callHelloSolana} style={{ padding: "10px 20px", fontSize: "16px" }}>
        Invoke "Hello, Solana!" Program
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default HelloSolana;
