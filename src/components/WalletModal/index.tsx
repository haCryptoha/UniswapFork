import { AutoColumn } from 'components/Column'
import { PrivacyPolicy } from 'components/PrivacyPolicy'
import Row, { AutoRow, RowBetween } from 'components/Row'
import { useWalletConnectMonitoringEventCallback } from 'hooks/useMonitoringEventCallback'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Info } from 'react-feather'
import ReactGA from 'react-ga4'
import styled from 'styled-components/macro'
import { AbstractConnector } from 'web3-react-abstract-connector'
import { UnsupportedChainIdError, useWeb3React } from 'web3-react-core'
import { WalletConnectConnector } from 'web3-react-walletconnect-connector'

import MetamaskIcon from '../../assets/images/metamask.png'
import { ReactComponent as Close } from '../../assets/images/x.svg'
import { fortmatic, injected, portis } from '../../connectors'
import { OVERLAY_READY } from '../../connectors/Fortmatic'
import { SUPPORTED_WALLETS } from '../../constants/wallet'
import usePrevious from '../../hooks/usePrevious'
import { useModalOpen, useWalletModalToggle } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { ExternalLink, ThemedText } from '../../theme'
import { isMobile } from '../../utils/userAgent'
import AccountDetails from '../AccountDetails'
import Card, { LightCard } from '../Card'
import Modal from '../Modal'
import Option from './Option'
import PendingView from './PendingView'
require("./style.css")

const CloseIcon = styled.div`
  position: absolute;
  right:5px;
 
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const CloseColor     = styled(Close)`
  path {
    stroke: ${({ theme }) => theme.text4};
  }
`

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 20px;
  width: 100%;
  border-radius: 40px;
  width: 507px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
  width: 350px;
`};
 
    
`

const HeaderRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: 1rem 1rem;
  padding: 15px;
  font-weight: 500;
  color: ${(props) => (props.color === 'blue' ? ({ theme }) => theme.primary1 : 'inherit')};
  color:#2172E5;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
    padding: 8px;
  `};
`

const ContentWrapper = styled.div`
  background-color:#16161f;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  padding: 0 1rem 1rem 1rem;

  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 0 1rem 1rem 1rem`};
 
`

const UpperSection = styled.div`
  position: relative;
 
  h5 {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 400;
  }

  h5:last-child {
    margin-bottom: 0px;
  }

  h4 {
    margin-top: 0;
    font-weight: 500;
  }
`

const OptionGrid = styled.div`
  display: grid;
  grid-gap: 10px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    grid-gap: 10px;
  `};
`

const HoverText = styled.div`
  text-decoration: none;
  display: flex;
  align-items: center;

  :hover {
    cursor: pointer;
  }
`

const LinkCard = styled(Card)`
  background-color: ${({ theme }) => theme.bg1};
  color: ${({ theme }) => theme.text3};

  :hover {
    cursor: pointer;
    filter: brightness(0.9);
  }
`

const WALLET_VIEWS = {
  OPTIONS: 'options',
  OPTIONS_SECONDARY: 'options_secondary',
  ACCOUNT: 'account',
  PENDING: 'pending',
  LEGAL: 'legal',
}

export default function WalletModal({
  pendingTransactions,
  confirmedTransactions,
  ENSName,
}: {
  pendingTransactions: string[] // hashes of pending
  confirmedTransactions: string[] // hashes of confirmed
  ENSName?: string
}) {
  // important that these are destructed from the account-specific web3-react context
  const { active, account, connector, activate, error } = useWeb3React()

  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)
  const previousWalletView = usePrevious(walletView)

  const [pendingWallet, setPendingWallet] = useState<AbstractConnector | undefined>()

  const [pendingError, setPendingError] = useState<boolean>()

  const walletModalOpen = useModalOpen(ApplicationModal.WALLET)
  const toggleWalletModal = useWalletModalToggle()

  const previousAccount = usePrevious(account)

  const logMonitoringEvent = useWalletConnectMonitoringEventCallback()

  // close on connection, when logged out before
  useEffect(() => {
    if (account && !previousAccount && walletModalOpen) {
      toggleWalletModal()
    }
  }, [account, previousAccount, toggleWalletModal, walletModalOpen])

  // always reset to account view
  useEffect(() => {
    if (walletModalOpen) {
      setPendingError(false)
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [walletModalOpen])

  // close modal when a connection is successful
  const activePrevious = usePrevious(active)
  const connectorPrevious = usePrevious(connector)
  useEffect(() => {
    if (walletModalOpen && ((active && !activePrevious) || (connector && connector !== connectorPrevious && !error))) {
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [setWalletView, active, error, connector, walletModalOpen, activePrevious, connectorPrevious])

  const tryActivation = async (connector: AbstractConnector | undefined) => {
    let name = ''
    Object.keys(SUPPORTED_WALLETS).map((key) => {
      if (connector === SUPPORTED_WALLETS[key].connector) {
        return (name = SUPPORTED_WALLETS[key].name)
      }
      return true
    })
    // log selected wallet
    ReactGA.event({
      category: 'Wallet',
      action: 'Change Wallet',
      label: name,
    })
    setPendingWallet(connector) // set wallet for pending view
    setWalletView(WALLET_VIEWS.PENDING)

    // if the connector is walletconnect and the user has already tried to connect, manually reset the connector
    if (connector instanceof WalletConnectConnector) {
      connector.walletConnectProvider = undefined
    }

    connector &&
      activate(connector, undefined, true)
        .then(async () => {
          const walletAddress = await connector.getAccount()
          logMonitoringEvent({ walletAddress })
        })
        .catch((error) => {
          if (error instanceof UnsupportedChainIdError) {
            activate(connector) // a little janky...can't use setError because the connector isn't set
          } else {
            setPendingError(true)
          }
        })
  }

  // close wallet modal if fortmatic modal is active
  useEffect(() => {
    fortmatic.on(OVERLAY_READY, () => {
      toggleWalletModal()
    })
  }, [toggleWalletModal])

  // get wallets user can switch too, depending on device/browser
  function getOptions() {
    const isMetamask = window.ethereum && window.ethereum.isMetaMask
    return Object.keys(SUPPORTED_WALLETS).map((key) => {
      const option = SUPPORTED_WALLETS[key]
      // check for mobile options
      if (isMobile) {
        //disable portis on mobile for now
        if (option.connector === portis) {
          return null
        }

        if (!window.web3 && !window.ethereum && option.mobile) {
          return (
            <Option
              onClick={() => {
                option.connector !== connector && !option.href && tryActivation(option.connector)
              }}
              id={`connect-${key}`}
              key={key}
              active={option.connector && option.connector === connector}
              color={option.color}
              link={option.href}
              header={option.name}
              subheader={null}
              icon={option.iconURL}
            />
          )
        }
        return null
      }

      // overwrite injected when needed
      if (option.connector === injected) {
        // don't show injected if there's no injected provider
        if (!(window.web3 || window.ethereum)) {
          if (option.name === 'MetaMask') {
            return (
              <Option
                id={`connect-${key}`}
                key={key}
                color={'#E8831D'}
                header="Install Metamask"
                subheader={null}
                link={'https://metamask.io/'}
                icon={MetamaskIcon}
              />
            )
          } else {
            return null //dont want to return install twice
          }
        }
        // don't return metamask if injected provider isn't metamask
        else if (option.name === 'MetaMask' && !isMetamask) {
          return null
        }
        // likewise for generic
        else if (option.name === 'Injected' && isMetamask) {
          return null
        }
      }

      // return rest of options
      return (
        !isMobile &&
        !option.mobileOnly && (
          <Option
            id={`connect-${key}`}
            onClick={() => {
              option.connector === connector
                ? setWalletView(WALLET_VIEWS.ACCOUNT)
                : !option.href && tryActivation(option.connector)
            }}
            key={key}
            active={option.connector === connector}
            color={option.color}
            link={option.href}
            header={option.name}
            subheader={null} //use option.descriptio to bring back multi-line
            icon={option.iconURL}
          />
        )
      )
    })
  }

  function getModalContent() {
    if (error) {
      return (
        <UpperSection>
          <CloseIcon onClick={toggleWalletModal}>
            <CloseColor />
          </CloseIcon>
          <HeaderRow>
            {error instanceof UnsupportedChainIdError ? "Wrong Network" : "Error connecting"}
          </HeaderRow>
          <ContentWrapper>
            {error instanceof UnsupportedChainIdError ? (
              <h5>
                Please connect to a supported network in the dropdown menu or in your wallet.
              </h5>
            ) : (
              "Error connecting. Try refreshing the page."
            )}
          </ContentWrapper>
        </UpperSection>
      )
    }
    if (walletView === WALLET_VIEWS.LEGAL) {
      return (
        <UpperSection >
          <HeaderRow>
            <HoverText
              onClick={() => {
                setWalletView(
                  (previousWalletView === WALLET_VIEWS.LEGAL ? WALLET_VIEWS.ACCOUNT : previousWalletView) ??
                  WALLET_VIEWS.ACCOUNT
                )
              }}
            >
              <ArrowLeft />
            </HoverText>
            <Row justify="center">
              <ThemedText.MediumHeader>
                Legal & Privacy
              </ThemedText.MediumHeader>
            </Row>
          </HeaderRow>
          <PrivacyPolicy />
        </UpperSection>
      )
    }
    if (account && walletView === WALLET_VIEWS.ACCOUNT) {
      return (
        <AccountDetails
          toggleWalletModal={toggleWalletModal}
          pendingTransactions={pendingTransactions}
          confirmedTransactions={confirmedTransactions}
          ENSName={ENSName}
          openOptions={() => setWalletView(WALLET_VIEWS.OPTIONS)}
        />
      )
    }
    return (
      <UpperSection>
        
        {walletView !== WALLET_VIEWS.ACCOUNT ? (
          <HeaderRow color="blue">
            <HoverText
              onClick={() => {
                setPendingError(false)
                setWalletView(WALLET_VIEWS.ACCOUNT)
              }}
            >
              <ArrowLeft />
            </HoverText>
          </HeaderRow>
        ) : (
          <HeaderRow className="modal-header" style={{ justifyContent: "center",    marginBottom: '20px' }} >
            <HoverText className="modal-header-text">
              Connect Wallet
            </HoverText>
            <CloseIcon onClick={toggleWalletModal} style={{ color: "white" }}>
                <CloseColor />
            </CloseIcon>    
          </HeaderRow>
        )}

        <ContentWrapper style={{ backgroundColor: "#16161f" }}>
          <AutoColumn gap="16px" style={{ justifyContent: "center" }}>
            {/* <LightCard>
              <AutoRow style={{ flexWrap: 'nowrap' }}>
                <ThemedText.Black fontSize={14}>

                  By connecting a wallet, you agree to Uniswap Labs???{' '}
                  <ExternalLink href="https://uniswap.org/terms-of-service/">Terms of Service</ExternalLink> and
                  acknowledge that you have read and understand the Uniswap{' '}
                  <ExternalLink href="https://uniswap.org/disclaimer/">Protocol Disclaimer</ExternalLink>.

                </ThemedText.Black>
              </AutoRow>
            </LightCard> */}
            {walletView === WALLET_VIEWS.PENDING ? (
              <PendingView
                connector={pendingWallet}
                error={pendingError}
                setPendingError={setPendingError}
                tryActivation={tryActivation}
              />
            ) : (
              <OptionGrid>{getOptions()}</OptionGrid>
            )}
            {/* <LinkCard padding=".5rem" $borderRadius=".75rem" onClick={() => setWalletView(WALLET_VIEWS.LEGAL)}> */}
           
          </AutoColumn>
        </ContentWrapper>
      </UpperSection>
    )
  }

  return (
    <Modal isOpen={walletModalOpen} onDismiss={toggleWalletModal} minHeight={false} maxHeight={100}>
      <div className="hideBackground">
          <div className = "walletOutline" style = {{background:'linear-gradient(73.6deg, rgb(133, 255, 196) 2.11%, rgb(92, 198, 255) 42.39%, rgb(188, 133, 255) 85.72%)',padding:'1px',borderRadius:'40px'}}>
            <Wrapper className='wallet-modal' style={{ backgroundColor: "#16161f" }} >{getModalContent()}</Wrapper>
          </div>
      </div>
      
      
    </Modal>
  )
}
