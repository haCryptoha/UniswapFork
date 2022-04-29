import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import { AutoColumn } from 'components/Column'
import { PositionPreview } from 'components/PositionPreview'
import styled from 'styled-components/macro'

import { Bound, Field } from '../../state/mint/v3/actions'

require('./style.css');
const Wrapper = styled.div`
  padding-top: 12px;
`

export function Review({
  position,
  outOfRange,
  ticksAtLimit,
}: {
  position?: Position
  existingPosition?: Position
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> }
  priceLower?: Price<Currency, Currency>
  priceUpper?: Price<Currency, Currency>
  outOfRange: boolean
  ticksAtLimit: { [bound in Bound]?: boolean | undefined }
}) {
  return (
    <Wrapper>
      <AutoColumn gap="lg">
        {position ? (
          <PositionPreview
            position={position}
            inRange={!outOfRange}
            ticksAtLimit={ticksAtLimit}
            title={'Selected Range'}
          />
        ) : <div style={{margin:'auto'}}>
				<img style={{'margin':'0px 0px 0px 13px'}} src="images/transaction.png" ></img>
				<p className = "transaction-submited">Transcation Submitted</p>
				<p className = "transaction-type">Liquidity Position Created</p>
			</div>}
      </AutoColumn>
    </Wrapper>
  )
}
