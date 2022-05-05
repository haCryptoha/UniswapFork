import React, { useState} from "react";

const LiquidityBox = () =>{
	const [collapse, setCollapse] = useState(true);
	const [removeClicked, setRemoveClicked] = useState(false)
	const [removed, setRemoved] = useState(false);
	const [withdraw, setWithdraw] = useState(false);
	const [claim, setClaim] = useState(false);
	
	const confimrOnClick = () => {
		setRemoved(true);
		removeOnClick();
	}
	const removeOnClick = () => {
        if (removeClicked === false)
            setRemoveClicked(true);
        else setRemoveClicked(false);
    }
	const changeCollpase = () => {
        if (collapse === true)
            setCollapse(false);
        else setCollapse(true);
    }
	const onWithdraw = () =>{
		setRemoveClicked(true);
		setWithdraw(true);
	}
	const onClaim = () => {
		setRemoveClicked(true);
		setWithdraw(false);
	}
	return (
	<>
	<TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash}
          content={() => (
            <ConfirmationModalContent
              title={""}
              onDismiss={handleDismissConfirmation}
              topContent={() => (
                <Review
                  parsedAmounts={parsedAmounts}
                  position={position}
                  existingPosition={existingPosition}
                  priceLower={priceLower}
                  priceUpper={priceUpper}
                  outOfRange={outOfRange}
                  ticksAtLimit={ticksAtLimit}
                />
              )}
              bottomContent={() => (
                <button className='view-etherscan' onClick={onAdd}>
                  <p>
                    View on Etherscan
                  </p>
                </button>
              )}
            />
          )}
          pendingText={pendingText}
        />
	{!removeClicked?(<>{!removed?<div className="single-liquidity-lend">
						<a onClick={changeCollpase} style={{ cursor: "pointer" }}>
							<div className="single-liquidity-header-lend">
								<div className="single-liquidity-header-left">
								 	<p >WETH</p>
								</div>
								<div className="single-liquidity-header-left" >
								 	<p >10000</p>
								</div>
								<div className="single-liquidity-header-right">
									<img src="./images/up1.png" style={{ width: "20px", height: "20px", display: collapse ? "none" : "block" }} />
									<img src="./images/down1.png" style={{ width: "20px", height: "20px", display: collapse ? "block" : "none" }} />
								</div>
							</div>
						</a>
                    <div className="single-liquidity-content" style={{ height: collapse ? "0px" : "296px",overflow: 'hidden' }}>
                        <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                            <p className="single-token-left">Your total pool tokens</p>
                            <p className="single-token-right">0.00092110891</p>
                        </div>
                        <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                            <p className="single-token-left">Pooled Eth</p>
                            <p className="single-token-right">0.000226482 ETH</p>
                        </div>
                        <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                            <p className="single-token-left">Pooled AWC</p>
                            <p className="single-token-right">0.00069512692 AWC</p>
                        </div>
                        <div style={{ display: collapse ? "none" : "flex", justifyContent: "space-between" }}>
                            <p className="single-token-left">Your pool share</p>
                            <p className="single-token-right">0.14%</p>
                        </div>
                        <div className="description" style={{ display: collapse ? "none" : "flex", transition: "1s" }}>
                            <p>View Accured Fees and Analytics</p>
                        </div>
                        <div style={{ display: collapse ? "none" : "flex", justifyContent: "center", transition: "1s" }}>
                            <button onClick={onWithdraw}><p className="font-bold">Withdraw</p></button>
							<div style={{width:"20px"}}></div>
							<button onClick={onClaim}><p className="font-bold">Claim</p></button>
                        </div>
                    </div>
		    </div>:<></>}
			</>)		
		    :withdraw?
				(<div className="lend-confirm-warrap">
                        <div className="lend-confirm">
                            <div className="remove-header-top" style={{ display: "flex", justifyContent: "center" }}>
                                <div className='go-back-arrow' style={{backgroundImage:'url(./images/left.png)'}} onClick={removeOnClick}></div>
                                <p>Withdraw Tokens</p>
                                <div className='help-button' style={{backgroundImage:'url(./images/help.png)'}}></div>
                            </div> 
                            <div className="remove-header">
                                <p >
                                    Confirm to close your position
                                </p>
                            </div>
                            <div className="remove-content">                               
                                <div className="description2">
                                    <div className="eth">
                                        <div className="lend-confirm-text">
                                            <p>50,000</p>
                                        </div>
                                        <div className="lend-confirm-text">
                                            <p>WETH</p>
                                        </div>
                                    </div>                                 
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                                        
                                        <button className="confirm" style={{ width:"100%", height: "48px", border: "0px" }} onClick={confimrOnClick}><p>confirm</p></button>
                                    </div>
                                </div>
                            </div>
                        </div>
				</div>)
				:(<div className="lend-confirm-claim-warrap">
                        <div className="lend-confirm-claim">
                            <div className="remove-header-top" style={{ display: "flex", justifyContent: "center" }}>
                                <div className='go-back-arrow' style={{backgroundImage:'url(./images/left.png)'}} onClick={removeOnClick}></div>
                                <p>Claim Reward</p>
                                <div className='help-button' style={{backgroundImage:'url(./images/help.png)'}}></div>
                            </div> 
                            <div className="remove-header">
                                <p >
                                    Update your Reward
                                </p>
                            </div>
                            <div className="remove-content">                               
                                <div className="description2">
                                    <div className="content-header">
										<p>Your Reward will mint</p>
									</div>
									<div className="eth">
                                        <div className="lend-confirm-text" style={{fontSize:"20px"}}>
                                            <p>DBJ</p>
                                        </div>
                                        <div className="lend-confirm-text" style={{fontSize:"20px"}}>
                                            <p>500</p>
                                        </div>
                                    </div>
									<div style={{ width: "450px", height: "71px", display: "flex", justifyContent: "center" }}>
                                            <p style={{ color: "grey", fontSize: "20px", fontWeight: "700" }}>Output is estimated. If the price changes by more thatn 0.5% your transaction will revert.</p>
                                        </div>									
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                                        
                                        <button className="confirm" style={{ width:"100%", height: "48px", border: "0px" }} onClick={confimrOnClick}><p>confirm</p></button>
                                    </div>
                                </div>
                            </div>
                        </div>
				</div>)
			
				
		}
	</>)
	
}
const LiquidityList = () => {
    const [collapse, setCollapse] = useState(false);
	const [removeClicked, setRemoveClicked] = useState(false);
    const [removeStatus, setRemovestatus] = useState(false);
	const [removeStatus1, setRemovestatus1] = useState(false);
	const [removeStatus2, setRemovestatus2] = useState(false);
    
    
    return (
        <>
            <div className="LiquidityList">
               
				   <>
					<LiquidityBox />
					<LiquidityBox />
					<LiquidityBox />
				   </>
				
            </div>
        </>
    )
}
export default LiquidityList;