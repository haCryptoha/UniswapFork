import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { FeeAmount, NonfungiblePositionManager } from '@uniswap/v3-sdk'
import ConfirmSwapModal from 'components/swap/ConfirmSwapModal'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useCallback, useContext, useEffect, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import ReactGA from 'react-ga4'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import {
  useDerivedMintInfo,
  useMintActionHandlers,
  useMintState
} from 'state/mint/hooks'
import {
  useRangeHopCallbacks,
  useV3DerivedMintInfo,
  useV3MintActionHandlers,
  useV3MintState,
} from 'state/mint/v3/hooks'
import { ThemeContext } from 'styled-components/macro'

import { ButtonError, ButtonLight, ButtonPrimary, ButtonText, ButtonYellow } from '../../components/Button'
import { BlueCard, OutlineCard, YellowCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import FeeSelector from '../../components/FeeSelector'
import HoverInlineText from '../../components/HoverInlineText'
import LiquidityChartRangeInput from '../../components/LiquidityChartRangeInput'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import { PositionPreview } from '../../components/PositionPreview'
import RangeSelector from '../../components/RangeSelector'
import PresetsButtons from '../../components/RangeSelector/PresetsButtons'
import RateToggle from '../../components/RateToggle'
import Row, { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import { SUSHI_VAULT_ADDRESSES } from '../../constants/addresses'
import { ZERO_PERCENT } from '../../constants/misc'
import { WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { useV3NFTPositionManagerContract, useVaultManagerContract } from '../../hooks/useContract'
import { useDerivedPositionInfo } from '../../hooks/useDerivedPositionInfo'
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { useUSDCValue } from '../../hooks/useUSDCPrice'
import { useV3PositionFromTokenId } from '../../hooks/useV3Positions'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Bound, Field } from '../../state/mint/v3/actions'
import { TransactionType } from '../../state/transactions/actions'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useIsExpertMode, useUserSlippageToleranceWithDefault } from '../../state/user/hooks'
import { ExternalLink, ThemedText } from '../../theme'
import approveAmountCalldata from '../../utils/approveAmountCalldata'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
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
  RightContainer,
  ScrollablePage,
  StackedContainer,
  StackedItem,
  StyledInput,
  Wrapper,
  HeaderTabs,
} from './styled'
require("./style.css");

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB, feeAmount: feeAmountFromUrl, tokenId },
  },
  history,
  }: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string; feeAmount?: string; tokenId?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const vaultManager = useVaultManagerContract()
  
  // check for existing position if tokenId in url
  const { position: existingPositionDetails, loading: positionLoading } = useV3PositionFromTokenId(
    tokenId ? BigNumber.from(tokenId) : undefined
  )
  const hasExistingPosition = !!existingPositionDetails && !positionLoading
  const { position: existingPosition } = useDerivedPositionInfo(existingPositionDetails)

  // fee selection from url
  const feeAmount: FeeAmount | undefined =
    feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
      ? parseFloat(feeAmountFromUrl)
      : undefined

  const baseCurrency = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  // prevent an error if they input ETH/WETH
  const quoteCurrency =
    baseCurrency && currencyB && baseCurrency.wrapped.equals(currencyB.wrapped) ? undefined : currencyB

  // mint state
  const { independentField, typedValue, startPriceTypedValue } = useMintState();

  const {
    dependentField,
    currencies,
    pair,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error,
  } = useDerivedMintInfo(baseCurrency ?? undefined, currencyB ?? undefined)
  const {
    errorMessage,
    depositADisabled,
    depositBDisabled,
    invertPrice,
    ticksAtLimit,
  } = useV3DerivedMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    existingPosition
  )
  const { onFieldAInput, onFieldBInput } =
  useMintActionHandlers(noLiquidity)

  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm
  const [waiting, setWaiting] = useState<boolean>(false)
  const [clickable, setClickable] = useState<boolean>(true)

  // capital efficiency warning
  const [showCapitalEfficiencyWarning, setShowCapitalEfficiencyWarning] = useState(false)

  useEffect(() => setShowCapitalEfficiencyWarning(false), [baseCurrency, quoteCurrency, feeAmount])

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings

  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const usdcValues = {
    [Field.CURRENCY_A]: useUSDCValue(parsedAmounts[Field.CURRENCY_A]),
    [Field.CURRENCY_B]: useUSDCValue(parsedAmounts[Field.CURRENCY_B]),
  }

  const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], chainId ? SUSHI_VAULT_ADDRESSES[chainId] : undefined)
  const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], chainId ? SUSHI_VAULT_ADDRESSES[chainId] : undefined)

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
  const addTransaction = useTransactionAdder()
  async function onAdd() {
    if(!clickable) return
    setClickable(false)
    if (!chainId || !library || !account) return

    if (!baseCurrency || !quoteCurrency) {
      return
    }
    if (vaultManager && account) {
      try {
        setWaiting(true);
        await vaultManager.addLiquidity(currencyId(baseCurrency), (parsedAmounts[Field.CURRENCY_A])?.quotient.toString(), currencyId(quoteCurrency)).then((response: TransactionResponse) => {
          setAttemptingTxn(false)
          addTransaction(response, {
            type: TransactionType.ADD_LIQUIDITY_V3_POOL,
            baseCurrencyId: currencyId(baseCurrency),
            quoteCurrencyId: currencyId(quoteCurrency),
            createPool: Boolean(noLiquidity),
            expectedAmountBaseRaw: parsedAmounts[Field.CURRENCY_A]?.quotient?.toString() ?? '0',
            expectedAmountQuoteRaw: parsedAmounts[Field.CURRENCY_B]?.quotient?.toString() ?? '0',
            feeAmount: 3000,
          })
          setWaiting(false);
        })
        
        ReactGA.event({
          category: 'Liquidity',
          action: 'Add',
          label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/'),
        })
      }
      catch (error) {
        
        setWaiting(false);
        console.error('Failed to send transaction', error)
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      }
    }
  }


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

  const handleCurrencyASelect = useCallback(
    (currencyANew: Currency) => {
      const [idA, idB] = handleCurrencySelect(currencyANew, currencyIdB)
      if (idB === undefined) {
        history.push(`/add/${idA}`)
      } else {
        history.push(`/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdB, history]
  )

  const handleCurrencyBSelect = useCallback(
    (currencyBNew: Currency) => {
      const [idB, idA] = handleCurrencySelect(currencyBNew, currencyIdA)
      if (idA === undefined) {
        history.push(`/add/${idB}`)
      } else {
        history.push(`/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdA, history]
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

  const pendingText = (<>Supplying {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} {currencies[Field.CURRENCY_A]?.symbol} and{' '}
  {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} {currencies[Field.CURRENCY_B]?.symbol}</>);
  
  const toggleWalletModal = useWalletModalToggle()
  const showConnectAWallet = Boolean(!account)
  return (
    <>
      <ScrollablePage>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash}
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

        <div className='remove-tab-warrap'>
          <PageWrapper wide={!hasExistingPosition} className="remove-tab">
            <HeaderTabs
              creating={false}
              adding={true}
              migrate={false}
              positionID={tokenId}
              defaultSlippage={DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE}
              showBackLink={!hasExistingPosition}
            >
            </HeaderTabs>
            <Wrapper className='remove-tab-content' >
              <ResponsiveTwoColumns wide={!hasExistingPosition} style={{ display: "block" }} className="remove-tab-content-inner">
                <div>
                  <DynamicSection
                    disabled={false}
                  >
                    <AutoColumn gap="md">
                      <ThemedText.Label style={{ fontSize: "16px", color: "white", fontWeight:'400px',marginBottom:'5px',height:'24px' }}>
                        Capital Type
                      </ThemedText.Label>
                      <div className='fromToken' style={{ display: "flex", justifyContent: "space-between" }}>
                          <CurrencyInputPanel
                            value={formattedAmounts[Field.CURRENCY_A]}
                            onUserInput={onFieldAInput}
                            onMax={() => {
                              onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                            }}
                            showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                            onCurrencySelect={handleCurrencyASelect}
                            currency={currencies[Field.CURRENCY_A] ?? null}
                            id="add-liquidity-input-tokena"
                            fiatValue={usdcValues[Field.CURRENCY_A]}
                            approved={approvalA === ApprovalState.APPROVED}
                            showCommonBases
                          />
                      </div>
                      <ThemedText.Label  style={{ fontSize: "16px", color: "white", fontWeight:'400px',marginBottom:'5px',height:'24px' }}>
                        Token
                      </ThemedText.Label>
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
                            approved={approvalB === ApprovalState.APPROVED}
                            id="add-liquidity-input-tokenb"
                            showCommonBases
                          />
                     </div> 
                    </AutoColumn>
                  </DynamicSection>
                </div>
              </ResponsiveTwoColumns>
            </Wrapper>
            {showConnectAWallet ? (
              <div className='add-liquidity-warrap'>
                <button className='add-liquidity' style={clickable?{ border: "0px" }:{border:'0px',cursor: 'not-allowed'}} onClick={toggleWalletModal}><p>Connect Wallet</p></button>
              </div>
            ):(error?
            <div className='add-liquidity-warrap' style={{opacity:'0.45'}}>
                <button className='add-liquidity' style={{border:'0px',cursor: 'not-allowed'}} ><p>{error}</p></button>
            </div>
            :
            <div className='add-liquidity-footer'>
              { approvalA === ApprovalState.NOT_APPROVED ? <button className='Approve-pair' style={{ border: "0px" }} onClick={approveACallback} >Approve</button>
                : approvalA === ApprovalState.PENDING ? <div className='Approve-success-warrap' style={{opacity:'0.45'}}>
                  <button className='Approve-success' style={{ border: "0px" }}><p style={{ color: "white" }}>Approving...</p></button>
                </div>
                  : <div className='add-liquidity-warrap'>
                    <button className='add-liquidity' style={clickable?{ border: "0px" }:{border:'0px',cursor: 'not-allowed'}} onClick={onAdd}><p>{waiting?'Transaction in progress-Please wait':'Add Liquidity'}</p></button>
                  </div>
              }
            </div>)
            }            
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
