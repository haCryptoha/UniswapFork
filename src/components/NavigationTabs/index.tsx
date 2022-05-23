// @ts-nocheck
import { Percent } from '@uniswap/sdk-core'
import useTheme from 'hooks/useTheme'
import { darken } from 'polished'
import { ReactNode } from 'react'
import { ArrowLeft } from 'react-feather'
import { Link as HistoryLink, NavLink, useLocation } from 'react-router-dom'
import { Box } from 'rebass'
import { useAppDispatch } from 'state/hooks'
import { resetMintState } from 'state/mint/actions'
import { resetMintState as resetMintV3State } from 'state/mint/v3/actions'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { RowBetween } from '../Row'
import SettingsTab from '../Settings'

const Tabs = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  border-radius: 3rem;
  justify-content: space-evenly;
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: center;
  height: 3rem;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text3};
  font-size: 20px;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

const StyledHistoryLink = styled(HistoryLink) <{ flex: string | undefined }>`
  flex: ${({ flex }) => flex ?? 'none'};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex: none;
    margin-right: 10px;
  `};
`

const ActiveText = styled.div`
  font-weight: 500;
  font-size: 20px;
`

const StyledArrowLeft = styled(ArrowLeft)`
  color: ${({ theme }) => theme.text1};
  color:white;
`

export function SwapPoolTabs({ active }: { active: 'swap' | 'pool' }) {
  return (
    <Tabs style={{ marginBottom: '20px', display: 'none', padding: '1rem 1rem 0 1rem' }}>
      <StyledNavLink id={`swap-nav-link`} to={'/swap'} isActive={() => active === 'swap'}>
        Swap
      </StyledNavLink>
      <StyledNavLink id={`pool-nav-link`} to={'/pool/all'} isActive={() => active === 'pool'}>
        Pool
      </StyledNavLink>
    </Tabs>
  )
}

export function FindPoolTabs({ origin }: { origin: string }) {
  return (
    <Tabs>
      <RowBetween style={{ padding: '1rem 1rem 0 1rem', position: 'relative' }}>
        <HistoryLink to={origin}>
          <StyledArrowLeft />
        </HistoryLink>
        <ActiveText style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          Import V2 Pool
        </ActiveText>
      </RowBetween>
    </Tabs>
  )
}

export function AddRemoveTabs({
  adding,
  creating,
  migrate,
  deposit,
  defaultSlippage,
  positionID,
  children,
}: {
  adding?: boolean | false
  creating?: boolean | false
  migrate?:boolean | false
  deposit?:boolean | false
  defaultSlippage: Percent
  positionID?: string | undefined
  showBackLink?: boolean
  children?: ReactNode | undefined
}) {
  const theme = useTheme()
  // reset states on back
  const dispatch = useAppDispatch()
  const location = useLocation()

  // detect if back should redirect to v3 or v2 pool page
  let poolLink = location.pathname.includes('add/v2')
    ? '/pool/v2'
    : '/pool' + (!!positionID ? `/${positionID.toString()}` : '')
  poolLink = location.pathname.includes('lend')
    ? '/lend' : ''  

  return (
    <Tabs>
      <RowBetween style={{ padding: '1rem 1rem 0 1rem' }}>
        <div className="arrow-left-warrap">
          <StyledHistoryLink
            to={poolLink}
            onClick={() => {
              if (adding) {
                // not 100% sure both of these are needed
                dispatch(resetMintState())
                dispatch(resetMintV3State())
              }
            }}
            flex={children ? '1' : undefined}
          >

            <StyledArrowLeft stroke={theme.text2} />
          </StyledHistoryLink>
        </div>
	     <ThemedText.MediumHeader
          fontWeight={500}
          fontSize={20}
          style={{ flex: '1', margin: 'auto', textAlign: children ? 'center' : 'center', color: "white" }}
        >
           {creating ? (
            <>Create a pair</>
          ) : adding ? (
            <>New Position</>
          ) : migrate?(
            <>Import</>
          ):deposit?(
            <>Deposit</>
          ):<></>} 
          
        </ThemedText.MediumHeader>
		
        <div className='settingTab-warrap'>
          <Box style={{ marginRight: '.5rem' }}>{children}</Box>
          <SettingsTab placeholderSlippage={defaultSlippage} />
        </div>
      </RowBetween>
    </Tabs >
  )
}
