import React, { useState } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram, Keypair , TransactionInstruction } from '@solana/web3.js';
import { Buffer } from 'buffer';
const App3 = () => {
    const [message, setMessage] = useState('');
    const [storedMessage, setStoredMessage] = useState('');
    const [messageAccount, setMessageAccount] = useState(null);
    const connection = new Connection('https://api.devnet.solana.com',"confirmed");

    const programId = new PublicKey('7oEK7Tmv7i9hkAEph9WTe9ZuNmchmW7NkXZpqXDP1qRj'); // Replace with your program ID

    const handleSetMessage = async () => {
        const provider = window.solana;
    
        if (!provider || !provider.isPhantom) {
            alert("Please connect to the Phantom wallet.");
            return;
        }
    
        try {
            await provider.connect();
            const walletPublicKey = provider.publicKey;
    
            const newMessageAccount = Keypair.generate();
            setMessageAccount(newMessageAccount.publicKey);
    
            const messageBuffer = Buffer.from(message);
            const space = messageBuffer.length + 8; // 8 additional bytes for any metadata your program might need
    
            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: walletPublicKey,
                    newAccountPubkey: newMessageAccount.publicKey,
                    lamports: await connection.getMinimumBalanceForRentExemption(space),
                    space: space,
                    programId: programId,
                }),
                new TransactionInstruction({
                    keys: [{ pubkey: newMessageAccount.publicKey, isSigner: true, isWritable: true }],
                    programId: programId,
                    data: messageBuffer,
                })
            );
    
            const { blockhash } = await connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = walletPublicKey;
    
            const signedTransaction = await provider.signTransaction(transaction);
            signedTransaction.partialSign(newMessageAccount);
            
            const rawTransaction = signedTransaction.serialize();
            const signature = await connection.sendRawTransaction(rawTransaction);
    
            console.log("Transaction sent:", signature);
    
            // Wait for confirmation
            const confirmationResponse = await connection.confirmTransaction(signature, 'confirmed');
            
            if (confirmationResponse.value.err) {
                throw new Error('Transaction failed: ' + JSON.stringify(confirmationResponse.value.err));
            }
    
            alert('Message set successfully!');
        } catch (error) {
            console.error("Error setting message:", error);
            alert('Failed to set message: ' + error.message);
        }
    };

    const handleGetMessage = async () => {
        if (!messageAccount) {
            alert('No message account found!');
            return;
        }

        const accountInfo = await connection.getAccountInfo(messageAccount);
        if (accountInfo) {
            const message = Buffer.from(accountInfo.data).toString();
            setStoredMessage(message);
        } else {
            alert('No message found in this account!');
        }
    };

    return (
        <div>
            <h1>Data Storage Program</h1>
            <input
                type="text"
                placeholder="Enter message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={handleSetMessage}>Set Message</button>
            <button onClick={handleGetMessage}>Get Message</button>
            <div>
                <h2>Stored Message: {storedMessage}</h2>
            </div>
        </div>
    );
};

export default App3;
