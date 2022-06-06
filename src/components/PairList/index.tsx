// @ts-nocheck
import { ButtonText } from 'components/Button'
import PairListItem from 'components/PairListItem'
import React, {useState} from 'react'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'
import { PositionDetails } from 'types/position'
import AssetListItme from 'components/AssetListItem'


const DesktopHeader = styled.div`
  display: none;
  font-size: 14px;
  font-weight: 500;
  padding: 8px;

  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    align-items: center;
    display: flex;
    justify-content: space-between;
    & > div:last-child {
      text-align: right;
      margin-right: 12px;
    }
  }
`

const MobileHeader = styled.div`
  font-weight: medium;
  font-size: 16px;
  font-weight: 500;
  padding: 8px;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: none;
  }
`

type PositionListProps = React.PropsWithChildren<{
  positions: PositionDetails[]
  setUserHideClosedPositions: any
  userHideClosedPositions: boolean
}>
 
 
export default function PairList({
  positions,
  setUserHideClosedPositions,
  userHideClosedPositions,
}: PositionListProps) {
 
 const [activeKey, setActiveKey] = useState<bundleID>("");
 
  return (
    <>
      <DesktopHeader>
        <div style={{color:'white'}}>
          Your positions
          {positions && ' (' + positions.length + ')'}
        </div>
        <ButtonText style={{ opacity: 1, color:'white' }} onClick={() => setUserHideClosedPositions(!userHideClosedPositions)}>
          {!userHideClosedPositions ? "Hide" : "Show"} closed positions
        </ButtonText>
      </DesktopHeader>
      <MobileHeader style={{color:'white'}}>
        Your positions
      </MobileHeader>
      {positions.map((p,index) => {
        if(p.amount) {
          return <AssetListItme key={p.id.toString()} positionDetails={p} />
        } else {
          return <PairListItem setActiveKey={setActiveKey} activeKey ={activeKey}  key={index} index={index} positionDetails={p} />
        }
      })}
    </>
  )
}
