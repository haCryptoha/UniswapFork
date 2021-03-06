// @ts-nocheck
import { Currency } from '@uniswap/sdk-core'
import Badge from 'components/Badge'
import { CHAIN_INFO } from 'constants/chainInfo'
import { L2_CHAIN_IDS, SupportedL2ChainId } from 'constants/chains'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useAddTokenToMetamask from 'hooks/useAddTokenToMetamask'
import { ReactNode, useContext } from 'react'
import { AlertCircle, AlertTriangle, ArrowUpRight, CheckCircle } from 'react-feather'
import { Text } from 'rebass'
import { useIsTransactionConfirmed, useTransaction } from 'state/transactions/hooks'
import styled, { ThemeContext } from 'styled-components/macro'

import Circle from '../../assets/images/blue-loader.svg'
import MetaMaskLogo from '../../assets/images/metamask.png'
import { ExternalLink } from '../../theme'
import { CloseIcon, CustomLightSpinner } from '../../theme'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { TransactionSummary } from '../AccountDetails/TransactionSummary'
import { ButtonLight, ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'
import Modal from '../Modal'
import { RowBetween, RowFixed } from '../Row'
import AnimatedConfirmation from './AnimatedConfirmation'

const WrapperBack = styled.div`
width: 50vw;
height: 512px;
max-width:512px;
position: absolute;
/* top: 50%; */
/* left: 50%; */
/* -webkit-transform: translate(-50%,-50%); */
-ms-transform: translate(-50%,-50%);
/* transform: translate(-50%,-50%); */
border-radius: 40px;
padding: 2px;
background: linear-gradient(to right,#11bbfe,#8c41fb);
-webkit-mask: linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
-webkit-mask-composite: xor;
${({ theme }) => theme.mediaWidth.upToMedium`
      width: 65vw;
      margin: 0;
    `}
    ${({ theme, mobile }) => theme.mediaWidth.upToSmall`
      width:  85vw;
     
    `}
`
const Wrapper = styled.div`
  width: 100%;

  height: 512px;
  border-radius: 40px;
  padding: 50px 40px;
  backdrop-filter: blur(2px);
  
 
`
const Section = styled(AutoColumn)<{ inline?: boolean }>`
  padding: ${({ inline }) => (inline ? '0' : '0')};
`

const BottomSection = styled(Section)`
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
`

const ConfirmedIcon = styled(ColumnCenter)<{ inline?: boolean }>`
  padding: ${({ inline }) => (inline ? '20px 0' : '32px 0;')};
  padding:0px;
`

const StyledLogo = styled.img`
  height: 16px;
  width: 16px;
  margin-left: 6px;
`

function ConfirmationPendingContent({
  onDismiss,
  pendingText,
  inline,
}: {
  onDismiss: () => void
  pendingText: ReactNode
  inline?: boolean // not in modal
}) {
  return (
    <Wrapper>
      <AutoColumn gap="md">
        {!inline && (
          <RowBetween>
            <div />
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        )}
        <ConfirmedIcon inline={inline}>
          <CustomLightSpinner src={Circle} alt="loader" size={inline ? '40px' : '90px'} />
        </ConfirmedIcon>
        <AutoColumn gap="12px" justify={'center'}>
          <Text fontWeight={500} fontSize={20} textAlign="center">
            Waiting For Confirmation
          </Text>
          <Text fontWeight={400} fontSize={16} textAlign="center">
            {pendingText}
          </Text>
          <Text fontWeight={500} fontSize={14} color="#565A69" textAlign="center" marginBottom="12px">
            Confirm this transaction in your wallet
          </Text>
        </AutoColumn>
      </AutoColumn>
    </Wrapper>
  )
}
function TransactionSubmittedContent({
  onDismiss,
  chainId,
  hash,
  currencyToAdd,
  inline,
}: {
  onDismiss: () => void
  hash: string | undefined
  chainId: number
  currencyToAdd?: Currency | undefined
  inline?: boolean // not in modal
}) {
  const theme = useContext(ThemeContext)

  const { library } = useActiveWeb3React()

  const { addToken, success } = useAddTokenToMetamask(currencyToAdd)

  return (
 
    <>
    <WrapperBack>

    </WrapperBack>
    <Wrapper>
      <Section inline={inline}>
        {!inline && (
          <RowBetween>
            <div />
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        )}
        <div style={{padding:'52px 40px 0px 40px', width:'100%'}}>
          <ConfirmedIcon inline={inline}>
            <img style={{'margin':'0px', width:'92px'}} src="images/transaction.png" ></img>
          </ConfirmedIcon>
          <AutoColumn gap="12px" justify={'center'}>
            <Text fontWeight={500} fontSize={24} textAlign="center" style={{marginTop:'41px', marginBottom:'70px'}} >
              Transaction Submitted
            </Text>
          
              
            
            {currencyToAdd && library?.provider?.isMetaMask && (
              <ButtonLight mt="12px" padding="6px 12px" width="fit-content" onClick={addToken}>
                {!success ? (
                  <RowFixed>
                    
                      Add {currencyToAdd.symbol} to Metamask <StyledLogo src={MetaMaskLogo} />
                    
                  </RowFixed>
                ) : (
                  <RowFixed>
                    Added {currencyToAdd.symbol} 
                    <CheckCircle size={'16px'} stroke={theme.green1} style={{ marginLeft: '6px' }} />
                  </RowFixed>
                )}
              </ButtonLight>
            )}
            {/*<ButtonPrimary onClick={onDismiss} style={{ margin: '20px 0 0 0' }}>
              <Text fontWeight={500} fontSize={20}>
                {inline ? 'Return' : 'Close'}
              </Text>
                </ButtonPrimary>*/}
          </AutoColumn>
        </div>
        {chainId && hash && (
              <ExternalLink href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}>
                <Text fontWeight={500} fontSize={20}  textAlign="center" className='view-etherscan'>
                  <p>View on Block Exploer</p>
                </Text>
              </ExternalLink>
            )}
      </Section>
    </Wrapper>
    </>
    

    
  )
}

export function ConfirmationModalContent({
  title,
  bottomContent,
  onDismiss,
  topContent,
}: {
  title: ReactNode
  onDismiss?: () => void | undefined
  topContent?: () => ReactNode | undefined
  bottomContent?: () => ReactNode | undefined
}) {
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <Text fontWeight={500} fontSize={16}>
            {title}
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        {topContent && topContent()}
      </Section>
      {bottomContent && <BottomSection gap="12px">{bottomContent()}</BottomSection>}
    </Wrapper>
  )
}

export function TransactionErrorContent({ message, onDismiss }: { message: ReactNode; onDismiss: () => void }) {
  const theme = useContext(ThemeContext)
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <Text fontWeight={500} fontSize={20}>
            Error
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <AutoColumn style={{ marginTop: 20, padding: '2rem 0' }} gap="24px" justify="center">
          <AlertTriangle color={theme.red1} style={{ strokeWidth: 1.5 }} size={64} />
          <Text
            fontWeight={500}
            fontSize={16}
            color={theme.red1}
            style={{ textAlign: 'center', width: '85%', wordBreak: 'break-word' }}
          >
            {message}
          </Text>
        </AutoColumn>
      </Section>
      <BottomSection gap="12px">
        <ButtonPrimary onClick={onDismiss}>
          Dismiss
        </ButtonPrimary>
      </BottomSection>
    </Wrapper>
  )
}

function L2Content({
  onDismiss,
  chainId,
  hash,
  pendingText,
  inline,
}: {
  onDismiss: () => void
  hash: string | undefined
  chainId: number
  currencyToAdd?: Currency | undefined
  pendingText: ReactNode
  inline?: boolean // not in modal
}) {
  const theme = useContext(ThemeContext)

  const transaction = useTransaction(hash)
  const confirmed = useIsTransactionConfirmed(hash)
  const transactionSuccess = transaction?.receipt?.status === 1

  // convert unix time difference to seconds
  const secondsToConfirm = transaction?.confirmedTime
    ? (transaction.confirmedTime - transaction.addedTime) / 1000
    : undefined

  const info = CHAIN_INFO[chainId as SupportedL2ChainId]

  return (
    <Wrapper>
      <Section inline={inline}>
        {!inline && (
          <RowBetween mb="16px">
            <Badge>
              <RowFixed>
                <StyledLogo src={info.logoUrl} style={{ margin: '0 8px 0 0' }} />
                {info.label}
              </RowFixed>
            </Badge>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        )}
        <ConfirmedIcon inline={inline}>
          {confirmed ? (
            transactionSuccess ? (
              // <CheckCircle strokeWidth={1} size={inline ? '40px' : '90px'} color={theme.green1} />
              <AnimatedConfirmation />
            ) : (
              <AlertCircle strokeWidth={1} size={inline ? '40px' : '90px'} color={theme.red1} />
            )
          ) : (
            <CustomLightSpinner src={Circle} alt="loader" size={inline ? '40px' : '90px'} />
          )}
        </ConfirmedIcon>
        <AutoColumn gap="12px" justify={'center'}>
          <Text fontWeight={500} fontSize={20} textAlign="center">
            {!hash ? (
              "Confirm transaction in wallet"
            ) : !confirmed ? (
              "Transaction Submitted"
            ) : transactionSuccess ? (
              "Success"
            ) : (
              "Error"
            )}
          </Text>
          <Text fontWeight={400} fontSize={16} textAlign="center">
            {transaction ? <TransactionSummary info={transaction.info} /> : pendingText}
          </Text>
          {chainId && hash ? (
            <ExternalLink href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}>
              <Text fontWeight={500} fontSize={14} color={theme.primary1}>
                View on Explorer
              </Text>
            </ExternalLink>
          ) : (
            <div style={{ height: '17px' }} />
          )}
          <Text color={theme.text3} style={{ margin: '20px 0 0 0' }} fontSize={'14px'}>
            {!secondsToConfirm ? (
              <div style={{ height: '24px' }} />
            ) : (
              <div>
                Transaction completed in 
                <span style={{ fontWeight: 500, marginLeft: '4px', color: theme.text1 }}>
                  {secondsToConfirm} seconds ????
                </span>
              </div>
            )}
          </Text>
          <ButtonPrimary onClick={onDismiss} style={{ margin: '4px 0 0 0' }}>
            <Text fontWeight={500} fontSize={20}>
              {inline ? Return : Close}
            </Text>
          </ButtonPrimary>
        </AutoColumn>
      </Section>
    </Wrapper>
  )
}

interface ConfirmationModalProps {
  isOpen: boolean
  onDismiss?: () => void | undefined
  hash?: string | undefined
  content?: () => ReactNode | undefined
  attemptingTxn?: boolean | undefined
  pendingText?: ReactNode | undefined
  currencyToAdd?: Currency | undefined
}

export default function TransactionConfirmationModal({
  isOpen,
  onDismiss,
  attemptingTxn,
  hash,
  pendingText,
  content,
  currencyToAdd,
}: ConfirmationModalProps) {
  const { chainId } = useActiveWeb3React()

  const isL2 = Boolean(chainId && L2_CHAIN_IDS.includes(chainId))

  if (!chainId) return null

  // confirmation screen
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} style={{background:'black'}}>
      {isL2 && (hash || attemptingTxn) ? (
        <L2Content chainId={chainId} hash={hash} onDismiss={onDismiss} pendingText={pendingText} />
      ) : attemptingTxn ? (
        <ConfirmationPendingContent onDismiss={onDismiss} pendingText={pendingText} />
      ) : hash ? (
        <TransactionSubmittedContent
          chainId={chainId}
          hash={hash}
          onDismiss={onDismiss}
          currencyToAdd={currencyToAdd}
        />
      ) : (
        content()
      )}
    </Modal>
  )
}
