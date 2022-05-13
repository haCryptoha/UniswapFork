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
import { useArgentWalletContract } from '../../hooks/useArgentWalletContract'
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
  // @ts-ignore
  const theme = useContext(ThemeContext)
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const expertMode = useIsExpertMode()
  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()
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
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    existingPosition
  )

  const { onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput, onStartPriceInput } =
    useV3MintActionHandlers(noLiquidity)

  const isValid = !errorMessage && !invalidRange

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

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

  const argentWalletContract = useArgentWalletContract()
  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    argentWalletContract ? undefined : parsedAmounts[Field.CURRENCY_A],
    chainId ? SUSHI_VAULT_ADDRESSES[chainId] : undefined
  )
  const [approvalB, approveBCallback] = useApproveCallback(
    argentWalletContract ? undefined : parsedAmounts[Field.CURRENCY_B],
    chainId ? SUSHI_VAULT_ADDRESSES[chainId] : undefined
  )

  const allowedSlippage = useUserSlippageToleranceWithDefault(
    outOfRange ? ZERO_PERCENT : DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE
  )

  async function onAdd() {
    if (!chainId || !library || !account) return

    if (!baseCurrency || !quoteCurrency) {
      return
    }
    if (vaultManager && account) {
      try {
        await vaultManager.addLiquidity(currencyId(baseCurrency), (parsedAmounts[Field.CURRENCY_A])?.quotient.toString(), currencyId(quoteCurrency));
        ReactGA.event({
          category: 'Liquidity',
          action: 'Add',
          label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/'),
        })
      }
      catch (error) {
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

  const handleFeePoolSelect = useCallback(
    (newFeeAmount: FeeAmount) => {
      onLeftRangeInput('')
      onRightRangeInput('')
      history.push(`/add/${currencyIdA}/${currencyIdB}/${newFeeAmount}`)
    },
    [currencyIdA, currencyIdB, history, onLeftRangeInput, onRightRangeInput]
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



  const clearAll = useCallback(() => {
    onFieldAInput('')
    onFieldBInput('')
    onLeftRangeInput('')
    onRightRangeInput('')
    history.push(`/add`)
  }, [history, onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput])

  // get value and prices at ticks
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetFullRange } =
    useRangeHopCallbacks(baseCurrency ?? undefined, quoteCurrency ?? undefined, feeAmount, tickLower, tickUpper, pool)

  // we need an existence check on parsed amounts for single-asset deposits
  const showApprovalA =
    !argentWalletContract && approvalA !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_A]
  const showApprovalB =
    !argentWalletContract && approvalB !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_B]

  const pendingText = `Supplying ${!depositADisabled ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) : ''} ${!depositADisabled ? currencies[Field.CURRENCY_A]?.symbol : ''
    } ${!outOfRange ? 'and' : ''} ${!depositBDisabled ? parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) : ''} ${!depositBDisabled ? currencies[Field.CURRENCY_B]?.symbol : ''
    }`

  const Buttons = () =>
    addIsUnsupported ? (
      <ButtonPrimary disabled={true} $borderRadius="12px" padding={'12px'}>
        <ThemedText.Main mb="4px">
          Unsupported Asset
        </ThemedText.Main>
      </ButtonPrimary>
    ) : !account ? (
      <ButtonLight onClick={toggleWalletModal} $borderRadius="12px" padding={'12px'}>
        Connect Wallet
      </ButtonLight>
    ) : (
      <AutoColumn gap={'md'}>
        {(approvalA === ApprovalState.NOT_APPROVED ||
          approvalA === ApprovalState.PENDING ||
          approvalB === ApprovalState.NOT_APPROVED ||
          approvalB === ApprovalState.PENDING) &&
          isValid && (
            <RowBetween>
              {showApprovalA && (
                <ButtonPrimary
                  onClick={approveACallback}
                  disabled={approvalA === ApprovalState.PENDING}
                  width={showApprovalB ? '48%' : '100%'}
                >
                  {approvalA === ApprovalState.PENDING ? (
                    <Dots>
                      Approving {currencies[Field.CURRENCY_A]?.symbol}
                    </Dots>
                  ) : (
                    <>Approve {currencies[Field.CURRENCY_A]?.symbol}</>
                  )}
                </ButtonPrimary>
              )}
              {showApprovalB && (
                <ButtonPrimary
                  onClick={approveBCallback}
                  disabled={approvalB === ApprovalState.PENDING}
                  width={showApprovalA ? '48%' : '100%'}
                >
                  {approvalB === ApprovalState.PENDING ? (
                    <Dots>
                      <>Approving {currencies[Field.CURRENCY_B]?.symbol}</>
                    </Dots>
                  ) : (
                    <>Approve {currencies[Field.CURRENCY_B]?.symbol}</>
                  )}
                </ButtonPrimary>
              )}
            </RowBetween>
          )}
        <ButtonError
          onClick={() => {
            expertMode ? onAdd() : setShowConfirm(true)
          }}
          disabled={
            !isValid ||
            (!argentWalletContract && approvalA !== ApprovalState.APPROVED && !depositADisabled) ||
            (!argentWalletContract && approvalB !== ApprovalState.APPROVED && !depositBDisabled)
          }
          error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
        >
          <Text fontWeight={500}><>{errorMessage ? errorMessage : "Preview"}</></Text>
        </ButtonError>
      </AutoColumn>
    )

  const [inputA, setInputA] = useState('');
  const [inputB, setInputB] = useState('');
  const changeInputA = (value: string) => {
    setInputA(value)
    if (value == '') { return; }
    setInputB((parseFloat(value) * 200).toString());
  }
  const changeInputB = (value: string) => {
    setInputB(value)
    if (value == '') { return; }
    setInputA((parseFloat(value) / 200).toString());
  }

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

        <div className='remove-tab-warrap'>
          <PageWrapper wide={!hasExistingPosition} className="remove-tab">
            <AddRemoveTabs
              creating={false}
              adding={true}
              migrate={false}
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
                  {baseCurrency && quoteCurrency ? (
                    <RateToggle
                      currencyA={baseCurrency}
                      currencyB={quoteCurrency}
                      handleRateToggle={() => {
                        if (!ticksAtLimit[Bound.LOWER] && !ticksAtLimit[Bound.UPPER]) {
                          onLeftRangeInput((invertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6) ?? '')
                          onRightRangeInput((invertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6) ?? '')
                          onFieldAInput(formattedAmounts[Field.CURRENCY_B] ?? '')
                        }
                        history.push(
                          `/add/${currencyIdB as string}/${currencyIdA as string}${feeAmount ? '/' + feeAmount : ''}`
                        )
                      }}
                    />
                  ) : null}
                </Row>
              )}
            </AddRemoveTabs>
            <Wrapper className='remove-tab-content' style={{ minWidth: "400px" }}>
              <ResponsiveTwoColumns wide={!hasExistingPosition} style={{ display: "block" }} className="remove-tab-content-inner">
                <AutoColumn gap="lg" className='select-pair-and-fee-tire' style={{ display: "none" }}>
                  {!hasExistingPosition && (
                    <>
                      <AutoColumn gap="md" >
                        <RowBetween paddingBottom="20px">
                          <ThemedText.Label>
                            Select Pair
                          </ThemedText.Label>
                        </RowBetween>
                        <RowBetween>
                          {/* <CurrencyDropdown
                          value={formattedAmounts[Field.CURRENCY_A]}
                          onUserInput={onFieldAInput}
                          hideInput={true}
                          onMax={() => {
                            onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                          }}
                          onCurrencySelect={handleCurrencyASelect}
                          showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                          currency={currencies[Field.CURRENCY_A] ?? null}
                          id="add-liquidity-input-tokena"
                          showCommonBases
                        /> */}

                          <div style={{ width: '12px' }} />

                          {/* <CurrencyDropdown
                          value={formattedAmounts[Field.CURRENCY_B]}
                          hideInput={true}
                          onUserInput={onFieldBInput}
                          onCurrencySelect={handleCurrencyBSelect}
                          onMax={() => {
                            onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                          }}
                          showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                          currency={currencies[Field.CURRENCY_B] ?? null}
                          id="add-liquidity-input-tokenb"
                          showCommonBases
                        /> */}
                        </RowBetween>

                        <FeeSelector
                          disabled={!quoteCurrency || !baseCurrency}
                          feeAmount={feeAmount}
                          handleFeePoolSelect={handleFeePoolSelect}
                          currencyA={baseCurrency ?? undefined}
                          currencyB={quoteCurrency ?? undefined}
                        />
                      </AutoColumn>{' '}
                    </>
                  )}
                  {hasExistingPosition && existingPosition && (
                    <PositionPreview
                      position={existingPosition}
                      title={"Selected Range"}
                      inRange={!outOfRange}
                      ticksAtLimit={ticksAtLimit}
                    />
                  )}
                </AutoColumn>
                <div>
                  <DynamicSection
                    disabled={tickLower === undefined || tickUpper === undefined || invalidPool || invalidRange}
                  >
                    <AutoColumn gap="md">
                      <ThemedText.Label style={{ fontSize: "16px", color: "white" }}>
                        Capital Type
                      </ThemedText.Label>
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
                        showCommonBases
                        locked={depositADisabled}
                      />
                      <ThemedText.Label style={{ fontSize: "16px", color: "white" }}>
                        Token
                      </ThemedText.Label>
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
                        locked={depositBDisabled}
                      />
                    </AutoColumn>
                  </DynamicSection>
                </div>
              </ResponsiveTwoColumns>
            </Wrapper>
            <div className='add-liquidity-footer'>
              {approvalA === ApprovalState.NOT_APPROVED ? <button className='Approve-pair' style={{ border: "0px" }} onClick={approveACallback} >Approve</button>
                : approvalA === ApprovalState.PENDING ? <div className='Approve-success-warrap'>
                  <button className='Approve-success' style={{ border: "0px" }}><p style={{ color: "white" }}>Transaction in progress-Please wait</p></button>
                </div>
                  : <div className='add-liquidity-warrap'>
                    <button className='add-liquidity' style={{ border: "0px" }} onClick={onAdd}><p>Add Liquidity</p></button>
                  </div>
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
