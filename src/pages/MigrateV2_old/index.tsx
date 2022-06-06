// @ts-nocheck
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import JSBI from 'jsbi'
import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'react-feather'
import { useLocation } from 'react-router'
import { Text } from 'rebass'

import { useMigratorContract } from '../../hooks/useContract'
import { ButtonDropdownLight } from '../../components/Button'
import { LightCard } from '../../components/Card'
import { BlueCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import CurrencyLogo from '../../components/CurrencyLogo'
import { FindPoolTabs } from '../../components/NavigationTabs'
import { MinimalPositionCard } from '../../components/PositionCard'
import Row from '../../components/Row'
import CurrencySearchModal from '../../components/SearchModal/CurrencySearchModal'
import { nativeOnChain } from '../../constants/tokens'
import { PairState, useV2Pair } from '../../hooks/useV2Pairs'
import { usePairAdder } from '../../state/user/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { StyledInternalLink } from '../../theme'
import { ThemedText } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import AppBody from '../AppBody'
import { Dots } from '../Pool/styleds'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { LP_MIGRATOR_ADDRESSES } from '../../constants/addresses'

enum Fields {
  TOKEN0 = 0,
  TOKEN1 = 1,
}

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

export default function MigrateV2() {
  const query = useQuery()

  const { account, chainId } = useActiveWeb3React()

  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN1)

  const migrateContract = useMigratorContract();
  const [currency0, setCurrency0] = useState<Currency | null>(() => (chainId ? nativeOnChain(chainId) : null))
  const [currency1, setCurrency1] = useState<Currency | null>(null)
  const [waiting, setWaiting] = useState<boolean>(false)
  const [clickable, setClickable] = useState<boolean>(true)

  const [pairState, pair] = useV2Pair(currency0 ?? undefined, currency1 ?? undefined)

  const addPair = usePairAdder()
  useEffect(() => {
    if (pair) {
      addPair(pair)
    }
  }, [pair, addPair])

  const validPairNoLiquidity: boolean =
    pairState === PairState.NOT_EXISTS ||
    Boolean(
      pairState === PairState.EXISTS &&
        pair &&
        JSBI.equal(pair.reserve0.quotient, JSBI.BigInt(0)) &&
        JSBI.equal(pair.reserve1.quotient, JSBI.BigInt(0))
    )

  const position: CurrencyAmount<Token> | undefined = useTokenBalance(account ?? undefined, pair?.liquidityToken)
  const hasPosition = Boolean(position && JSBI.greaterThan(position.quotient, JSBI.BigInt(0)))

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      if (activeField === Fields.TOKEN0) {
        setCurrency0(currency)
      } else {
        setCurrency1(currency)
      }
    },
    [activeField]
  )

  const [approval, approveManually] = useApproveCallback(position, chainId ? LP_MIGRATOR_ADDRESSES[chainId] : undefined)
  const approve = useCallback(async () => {
    await approveManually()
  });

  const handleSearchDismiss = useCallback(() => {
    setShowSearch(false)
  }, [setShowSearch])

  async function onImport() {
    if(!clickable) return
    setClickable(false)
    if (!chainId || !account) return

    if (migrateContract && account) {
      try {
        setWaiting(true);
        console.log(pair);
        console.log(position.quotient.toString());
        await migrateContract.importLPTokens(pair?.liquidityToken.address, position.quotient.toString()).then((response: TransactionResponse) => {
          setAttemptingTxn(false)
          setWaiting(false);
        })

        ReactGA.event({
          category: 'Liquidity',
          action: 'Import',
          label: [pair?.token0?.symbol, pair?.token1?.symbol].join('/'),
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

  const prerequisiteMessage = (
    <LightCard padding="45px 10px">
      <Text textAlign="center">
        {!account ? (
          "Connect to a wallet to find pools"
        ) : (
          "Select a token to find your liquidity."
        )}
      </Text>
    </LightCard>
  )

  return (
    <div style={{background:'linear-gradient(73.6deg,rgb(133,255,196) 2.11%,rgb(92,198,255) 42.39%,rgb(188,133,255) 85.72%)', padding:'1px',borderRadius:'8px'}}>
      <AppBody>
        <FindPoolTabs origin={query.get('origin') ?? '/pool/v2'} />
        <AutoColumn style={{ padding: '1rem',display:'grid' }} gap="md">
          <BlueCard>
            <AutoColumn gap="10px">
              <ThemedText.Link fontWeight={400} color={'primaryText1'}>
               
              <b>Tip:</b> Use this tool to find liquidity pools that wasn&apos;t added using the Double interface.
                
              </ThemedText.Link>
            </AutoColumn>
          </BlueCard>
          <ButtonDropdownLight
            onClick={() => {
              setShowSearch(true)
              setActiveField(Fields.TOKEN0)
            }}
          >
            {currency0 ? (
              <Row>
                <CurrencyLogo currency={currency0} />
                <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                  {currency0.symbol}
                </Text>
              </Row>
            ) : (
              <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                Select a token
              </Text>
            )}
          </ButtonDropdownLight>

          <ColumnCenter>
            <Plus size="16" color="#888D9B" />
          </ColumnCenter>

          <ButtonDropdownLight
            onClick={() => {
              setShowSearch(true)
              setActiveField(Fields.TOKEN1)
            }}
          >
            {currency1 ? (
              <Row>
                <CurrencyLogo currency={currency1} />
                <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                  {currency1.symbol}
                </Text>
              </Row>
            ) : (
              <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                Select a token
              </Text>
            )}
          </ButtonDropdownLight>

          {hasPosition && (
            <ColumnCenter
              style={{ justifyItems: 'center', backgroundColor: '', padding: '12px 0px', borderRadius: '12px' }}
            >
              <Text textAlign="center" fontWeight={500}>
                Pool Found!
              </Text>
              <StyledInternalLink to={`/pool/v2`}>
                <Text textAlign="center">
                  Manage this pool.
                </Text>
              </StyledInternalLink>
            </ColumnCenter>
          )}

          {currency0 && currency1 ? (
            pairState === PairState.EXISTS ? (
              hasPosition && pair ? (
                <>
                  <MinimalPositionCard pair={pair} border="1px solid #CED0D9" />
                  <div className='add-liquidity-warrap'>
                    {
                      approval === ApprovalState.NOT_APPROVED ? 
                        <button className='add-liquidity' style={clickable?{ border: "0px" }:{border:'0px',cursor: 'not-allowed'}} onClick={approve}><p>{approval === ApprovalState.PENDING?'Approving':'Approve'}</p></button>
                      :
                        <button className='add-liquidity' style={clickable?{ border: "0px" }:{border:'0px',cursor: 'not-allowed'}} onClick={onImport}><p>{waiting?'Transaction in progress-Please wait':'Import Liquidity'}</p></button>
                    }
                  </div>
                </>
              ) : (
                <LightCard padding="45px 10px">
                  <AutoColumn gap="sm" justify="center">
                    <Text textAlign="center">
                      You don’t have liquidity in this pool yet.
                    </Text>
                    <StyledInternalLink to={`/add/${currencyId(currency0)}/${currencyId(currency1)}`}>
                      <Text textAlign="center">
                        Add liquidity.
                      </Text>
                    </StyledInternalLink>
                  </AutoColumn>
                </LightCard>
              )
            ) : validPairNoLiquidity ? (
              <LightCard padding="45px 10px">
                <AutoColumn gap="sm" justify="center">
                  <Text textAlign="center">
                    No pool found.
                  </Text>
                  <StyledInternalLink to={`/add/${currencyId(currency0)}/${currencyId(currency1)}`}>
                    Create pool.
                  </StyledInternalLink>
                </AutoColumn>
              </LightCard>
            ) : pairState === PairState.INVALID ? (
              <LightCard padding="45px 10px">
                <AutoColumn gap="sm" justify="center">
                  <Text textAlign="center" fontWeight={500}>
                    Invalid pair.
                  </Text>
                </AutoColumn>
              </LightCard>
            ) : pairState === PairState.LOADING ? (
              <LightCard padding="45px 10px">
                <AutoColumn gap="sm" justify="center">
                  <Text textAlign="center">
                    Loading
                    <Dots />
                  </Text>
                </AutoColumn>
              </LightCard>
            ) : null
          ) : (
            prerequisiteMessage
          )}
        </AutoColumn>

        <CurrencySearchModal
          isOpen={showSearch}
          onCurrencySelect={handleCurrencySelect}
          onDismiss={handleSearchDismiss}
          showCommonBases
          selectedCurrency={(activeField === Fields.TOKEN0 ? currency1 : currency0) ?? undefined}
        />
      </AppBody>
      
    </div>
  )
}