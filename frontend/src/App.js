import { useCallback, useEffect, useRef, useState } from "react";
import { Contract, providers, ethers } from 'ethers';
import Web3Modal from 'web3modal';
import {
  BUY_COFFEE_CONTRACT_ADDRESS,
  BUY_COFFEE_ABI,
} from "./contract";


function App() {

  const CHAIN_ID = 11155111;
  const NETWORK_NAME = "Sepolia";
  const CURRENCY = "ETH";

  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(false);
  const [contractOwner, setContractOwner] = useState(null);
  const [amount, setAmount] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState(null);
  const [contractBalance, setContractBalance] = useState(null);

  const web3ModalRef = useRef();

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.getFullYear() + "-" +
           ("0" + (date.getMonth() + 1)).slice(-2) + "-" +
           ("0" + date.getDate()).slice(-2) + " " +
           ("0" + date.getHours()).slice(-2) + ":" +
           ("0" + date.getMinutes()).slice(-2) + ":" +
           ("0" + date.getSeconds()).slice(-2) + " GMT";
  };

  // Helper function to fetch a Provider instance from Metamask
  const getProvider = useCallback(async () => {
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);
      const getSigner = web3Provider.getSigner();

      const { chainId } = await web3Provider.getNetwork();

      setAccount(await getSigner.getAddress());
      setWalletConnected(true)


      if (chainId !== CHAIN_ID) {
      window.alert(`Please switch to the ${NETWORK_NAME} network!`);
          throw new Error(`Please switch to the ${NETWORK_NAME} network`);
      }
      setProvider(web3Provider);
  }, []);

  // Helper function to fetch a Signer instance from Metamask
  const getSigner = useCallback(async () => {
      const web3Modal = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(web3Modal);

      const { chainId } = await web3Provider.getNetwork();

      if (chainId !== CHAIN_ID) {
      window.alert(`Please switch to the ${NETWORK_NAME} network!`);
          throw new Error(`Please switch to the ${NETWORK_NAME} network`);
      }
      
      const signer = web3Provider.getSigner();
      return signer;
  }, []);

  const getCoffeeContractInstance = useCallback((providerOrSigner) => {
    return new Contract(
        BUY_COFFEE_CONTRACT_ADDRESS,
        BUY_COFFEE_ABI,
        providerOrSigner
    )
  },[]);

  const buyCoffee = async (e) => {
    e.preventDefault();

    if(amount === "" || senderName === "" || message === "") {
      alert("Fill the necessary inputs");
    } else {
      try {
        const amountInWei = ethers.utils.parseEther(amount);

        const signer = await getSigner();

        const buyCoffeeContract = getCoffeeContractInstance(signer);
        const txn = await buyCoffeeContract.buyCoffee(senderName, message, { value: amountInWei });
        setLoading(true);
        await txn.wait();
        setLoading(false);

        const tipMemos = await buyCoffeeContract.getMemos();
        const tipBalance = await buyCoffeeContract.getTipBalance();

        setMemos(tipMemos);
        setContractBalance(tipBalance);
        
      } catch (error) {
        console.error(error);
      }
    }
  }

  const withdrawTips = async (e) => {
    e.preventDefault();

    try {
      const signer = await getSigner();

      const buyCoffeeContract = getCoffeeContractInstance(signer);
      const txn = await buyCoffeeContract.withdrawTips();
      setLoading(true);
      await txn.wait();
      setLoading(false);

      const tipBalance = await buyCoffeeContract.getTipBalance();
      
      setContractBalance(tipBalance);
      
      
    } catch (error) {
      console.error(error);
    }
  }

  const connectWallet = useCallback(async () => {
    try {
        web3ModalRef.current = new Web3Modal({
            network: NETWORK_NAME,
            providerOptions: {},
            disableInjectedProvider: false,
        });

        await getProvider();
    } catch (error) {
        console.error(error);
    }
  },[getProvider]);

  useEffect(() => {
    const fetchCoffeeDetails = async () => {
      if(account && provider) {
        try {
          const buyCoffeeContract = getCoffeeContractInstance(provider);
          const tipMemos = await buyCoffeeContract.getMemos();
          const tipBalance = await buyCoffeeContract.getTipBalance();
          const owner = await buyCoffeeContract.owner();

          setMemos(tipMemos);
          setContractOwner(owner);
          setContractBalance(tipBalance);
        } catch (error) {
          console.error(error);
        }
      }
    }

    fetchCoffeeDetails();
  }, [account, provider]);

  useEffect(() => {
    if(!walletConnected) {
        connectWallet();
    }
  }, [walletConnected, connectWallet]);

  return (
    <div className="container">
      <div className="mb-3">
        <nav className="navbar navbar-expand-lg navbar-light bg-dark">
          <a className="navbar-brand text-white" href="!#">
            Buy Me A Coffee
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-toggle="collapse"
            data-target="#navbarText"
            aria-controls="navbarText"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarText">
            <ul className="navbar-nav mr-auto">
              
            </ul>
            
            <span className="navbar-text">
              {!walletConnected ? <button className="btn btn-danger" onClick={connectWallet}>Connect Wallet</button> : <button className="btn btn-light" disabled>{account !== null ? account : "Connected"}</button>}
            </span>

            <span>
            {account !== null && contractOwner !== null && account === contractOwner && 
              <button className="btn btn-success ml-3">{contractBalance !== null ? ethers.utils.formatEther(contractBalance) : 0} {CURRENCY}</button>
            }
            </span>
          </div>
        </nav>
      </div>

      <div className="row">
        <div className="col-md-1"></div>

        <div className="col-md-10 mt-5 mb-5">
            <div className="card">
              <div className="card-body">
                <h3>Buy Me A Coffee</h3>
                <form>
                    <div className="form-group">
                        <label htmlFor="target">Amount</label>
                        <input
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="Amount"
                          onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="sender">Name</label>
                        <input
                          id="sender"
                          type="text"
                          className="form-control"
                          placeholder="Sender's Name"
                          onChange={(e) => setSenderName(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                      <label htmlFor="message">Message</label>
                      <textarea className="form-control" id="message" cols="30" rows="5" onChange={(e) => setMessage(e.target.value)}></textarea>
                    </div>

                    <button className={loading ? "btn btn-secondary btn-block" : "btn btn-dark btn-block"} disabled={loading ? "disabled" : ""} onClick={buyCoffee}>{loading ? "Processing" : "Buy Coffee"}</button>

                    {account !== null && contractOwner !== null && account === contractOwner && 
                      <button className={loading ? "btn btn-secondary btn-block mt-3" : "btn btn-success btn-block mt-3"} disabled={loading ? "disabled" : ""} onClick={withdrawTips}>{loading ? "Processing" : "Withdraw Tips"}</button>
                    }
                </form>
              </div>
            </div>
            

            <br /><br />

            {memos !== null && memos.length > 0 && memos.map((memo, index) => (
              <div className="card mb-2" key={index}>
                <div className="card-body">
                  <h4>{memo.name}</h4>
                  <div className="d-flex justify-content-between align-items-center">
                    <p>
                      {memo.message}
                    </p>
                    <p><code>{formatDate(memo.timestamp)}</code></p>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="col-md-1"></div>
      </div>
    </div>
  );
}

export default App;
