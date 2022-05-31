import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { FeeAmount, NonfungiblePositionManager } from '@uniswap/v3-sdk'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useCallback, useContext, useEffect, useState } from 'react'
import ReactGA from 'react-ga4'
import { Link, RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import {
  useV3DerivedMintInfo,
  useV3MintActionHandlers,
  useV3MintState,
} from 'state/mint/v3/hooks'
import { ThemeContext } from 'styled-components/macro'

import { ButtonError, ButtonLight, ButtonPrimary, ButtonText, ButtonYellow } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import Row, { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import { ASSET_VAULT_ADDRESSES } from '../../constants/addresses'
import { ZERO_PERCENT } from '../../constants/misc'
import { WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { useV3NFTPositionManagerContract, useAssetVaultContract } from '../../hooks/useContract'
import { useDerivedPositionInfo } from '../../hooks/useDerivedPositionInfo'
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { useUSDCValue } from '../../hooks/useUSDCPrice'
import { useV3PositionFromTokenId } from '../../hooks/useV3Positions'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Bound, Field } from '../../state/mint/v3/actions'
import { ExternalLink, ThemedText } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { Dots } from '../Pool/styleds'
import { Review } from './Review'
import {
  CurrencyDropdown,
  DynamicSection,
  HideMedium,
  MediumOnly,
  PageWrapper,
  ResponsiveTwoColumns,
  ScrollablePage,
  Wrapper,
} from './styled'
require("./style.css");

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

export default function Deposit({
  match: {
    params: { currencyIdA, currencyIdB, feeAmount: feeAmountFromUrl, tokenId },
  },
  history,
}: RouteComponentProps<{ currencyIdA?: string ; currencyIdB?: string; feeAmount?: string; tokenId?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  // check for existing position if tokenId in url
  const { position: existingPositionDetails, loading: positionLoading } = useV3PositionFromTokenId(
    tokenId ? BigNumber.from(tokenId) : undefined
  )
  const hasExistingPosition = !!existingPositionDetails && !positionLoading
  const { position: existingPosition } = useDerivedPositionInfo(existingPositionDetails)
  // fee selection from url
  const feeAmount: FeeAmount | undefined =
    feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
      ? parseFloat('3000')
      : undefined
  
  const currencyB = useCurrency(currencyIdB)
  // mint state
  const { independentField, typedValue, startPriceTypedValue } = useV3MintState()

  const {
    pool,
    ticks,
    dependentField,
    price,
    pricesAtTicks,
    parsedAmounts,
    currencyBalances,
    position,
    noLiquidity,
    currencies,
    errorMessage,
    invalidPool,
    invalidRange,
    outOfRange,
    depositADisabled,
    depositBDisabled,
    invertPrice,
    ticksAtLimit,
  } = useV3DerivedMintInfo(
    undefined,
    currencyB!,
    feeAmount,
    undefined,
    existingPosition
  )

  const { onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput } =
    useV3MintActionHandlers(noLiquidity)

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const usdcValues = {
    [Field.CURRENCY_B]: useUSDCValue(parsedAmounts[Field.CURRENCY_B]),
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      }
    },
    {}
  )

  const atMaxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
      }
    },
    {}
  )

  const assetVault = useAssetVaultContract()

  const [approvalB, approveBCallback] = useApproveCallback(
    parsedAmounts[Field.CURRENCY_B],
    chainId ? ASSET_VAULT_ADDRESSES[chainId] : undefined
  )

  async function onDeposit() {
    // if(!clickable) return
    // setClickable(false)
    if (!chainId || !library || !account) return
    if (assetVault && account) {
      try {
        // setWaiting(true);
        console.log((parsedAmounts[Field.CURRENCY_B])?.quotient.toString());
        await assetVault.deposit(currencyIdB, (parsedAmounts[Field.CURRENCY_B])?.quotient.toString()).then((response: TransactionResponse) => {
          setAttemptingTxn(false)
          setShowConfirm(true)
          // addTransaction(response, {
          //   type: TransactionType.ADD_LIQUIDITY_V3_POOL,
          //   baseCurrencyId: currencyId(baseCurrency),
          //   quoteCurrencyId: currencyId(quoteCurrency),
          //   createPool: Boolean(noLiquidity),
          //   expectedAmountBaseRaw: parsedAmounts[Field.CURRENCY_A]?.quotient?.toString() ?? '0',
          //   expectedAmountQuoteRaw: parsedAmounts[Field.CURRENCY_B]?.quotient?.toString() ?? '0',
          //   feeAmount: 3000,
          // })
          // setWaiting(false);
        })
        
        ReactGA.event({
          category: 'Liquidity',
          action: 'Add',
          label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/'),
        })
      }
      catch (error) {
        
        // setWaiting(false);
        console.error('Failed to send transaction', error)
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      }
    }
  }
  const showConnectAWallet = Boolean(!account)
  const handleCurrencySelect = useCallback(
    (currencyNew: Currency, currencyIdOther?: string): (string | undefined)[] => {
      const currencyIdNew = currencyId(currencyNew)

      if (currencyIdNew === currencyIdOther) {
        // not ideal, but for now clobber the other if the currency ids are equal
        return [currencyIdNew, undefined]
      } else {
        // prevent weth + eth
        const isETHOrWETHNew =
          currencyIdNew === 'ETH' ||
          (chainId !== undefined && currencyIdNew === WRAPPED_NATIVE_CURRENCY[chainId]?.address)
        const isETHOrWETHOther =
          currencyIdOther !== undefined &&
          (currencyIdOther === 'ETH' ||
            (chainId !== undefined && currencyIdOther === WRAPPED_NATIVE_CURRENCY[chainId]?.address))

        if (isETHOrWETHNew && isETHOrWETHOther) {
          return [currencyIdNew, undefined]
        } else {
          return [currencyIdNew, currencyIdOther]
        }
      }
    },
    [chainId]
  )

  const handleCurrencyBSelect = useCallback(
    (currencyBNew: Currency) => {
	  const feeamount = '3000'
      const [idB, idA] = handleCurrencySelect(currencyBNew, currencyIdA)
      if (idA === undefined) {
        history.push(`/lend/deposit/${idB}`)
      } else {
        history.push(`/lend/deposit/${idA}/${idB}/${feeamount}`)
      }
    },
    [handleCurrencySelect, currencyIdA, history]
  )

  const handleFeePoolSelect = useCallback(
    (newFeeAmount: FeeAmount) => {
      onLeftRangeInput('')
      onRightRangeInput('')
      history.push(`/lend/${currencyIdB}`)
    },
    [currencyIdB,history, onLeftRangeInput, onRightRangeInput]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
      // dont jump to pool page if creating
      history.push('/pool')
    }
    setTxHash('')
  }, [history, onFieldAInput, txHash])

  const addIsUnsupported = useIsSwapUnsupported(currencies?.CURRENCY_A, currencies?.CURRENCY_B)
  //add test
  const [approve, setApprove] = useState(false);


  const clearAll = useCallback(() => {
    onFieldAInput('')
    onFieldBInput('')
    onLeftRangeInput('')
    onRightRangeInput('')
    history.push(`/add`)
  }, [history, onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput])

  // get value and prices at ticks
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  const pendingText = `Supplying ${!depositADisabled ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) : ''} ${!depositADisabled ? currencies[Field.CURRENCY_A]?.symbol : ''
    } ${!outOfRange ? 'and' : ''} ${!depositBDisabled ? parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) : ''} ${!depositBDisabled ? currencies[Field.CURRENCY_B]?.symbol : ''
    }`

  return (
    <>
      <ScrollablePage style={{margin: "50px 0px 0px 0px"}}>
      <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={"0x4698e1e048d920e0551c927363ba9a4746dc72394484d9974b8a37eb075ba2e3"}
          content={() => (
            <ConfirmationModalContent
              title={""}
              onDismiss={handleDismissConfirmation}
              bottomContent={() => (
                <button className='view-etherscan'>
                  <p>
                    View on Etherscan
                  </p>
                </button>
              )}
            />
          )}
          pendingText={pendingText}
        />
       
        <div className='remove-tab-warrap-deposit'>
          <PageWrapper wide={!hasExistingPosition} className="remove-tab-deposit">
            <AddRemoveTabs
			  deposit={true}
              positionID={tokenId}
              defaultSlippage={DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE}
              showBackLink={!hasExistingPosition}
            >
              {!hasExistingPosition && (
                <Row justifyContent="flex-end" style={{ width: 'fit-content', minWidth: 'fit-content' }}>
                  <MediumOnly>
                    <ButtonText onClick={clearAll} margin="0 15px 0 0">
                      <ThemedText.Blue fontSize="12px">
                        Clear All
                      </ThemedText.Blue>
                    </ButtonText>
                  </MediumOnly>
                </Row>
              )}
            </AddRemoveTabs>
            <Wrapper className='remove-tab-content' >
              <ResponsiveTwoColumns wide={!hasExistingPosition} style={{ display: "block" }} className="remove-tab-content-inner">
                
                <div>
                  <DynamicSection
                    disabled={tickLower === undefined || tickUpper === undefined || invalidPool || invalidRange}
                    className="deposit-amount"
                  >
                        <AutoColumn gap="md">
                         
                          
                          <div className='toToken' style={{ display: "flex", justifyContent: "space-between" }}>
                              <CurrencyInputPanel
                                value={formattedAmounts[Field.CURRENCY_B]}
                                onUserInput={onFieldBInput}
                                onMax={() => {
                                  onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                                }}
                                showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                                fiatValue={usdcValues[Field.CURRENCY_B]}
                                currency={currencies[Field.CURRENCY_B] ?? null}
                                onCurrencySelect={handleCurrencyBSelect}
                                id="add-liquidity-input-tokenb"
                                showCommonBases
                              />
                          </div>                   
                          
                        </AutoColumn>
                    </DynamicSection>
                </div>

                
              </ResponsiveTwoColumns>
            </Wrapper>
            <div className='add-liquidity-footer'>              
              {
                showConnectAWallet ? (
                  <div className='add-liquidity-warrap'>
                    <button className='add-liquidity' onClick={toggleWalletModal}><p>Connect Wallet</p></button>
                  </div>
                ):(
                
                   approvalB === ApprovalState.NOT_APPROVED ? <button className='Approve-pair' style={{ border: "0px" }} onClick={approveBCallback} >Approve</button>
                    : approvalB === ApprovalState.PENDING ? <div className='Approve-success-warrap'>
                      <button className='Approve-success' style={{ border: "0px" }}><p style={{ color: "white" }}>Approving</p></button>
                    </div>
                      : <div className='add-liquidity-warrap'>
                           <button className='add-liquidity'  onClick={()=>onDeposit()}><p>Deposit</p></button>
                        </div>
                  
                )
              }
            </div>
          </PageWrapper>
        </div>

        {addIsUnsupported && (
          <UnsupportedCurrencyFooter
            show={addIsUnsupported}
            currencies={[currencies.CURRENCY_A, currencies.CURRENCY_B]}
          />
        )}
      </ScrollablePage>
    </>
  )
}