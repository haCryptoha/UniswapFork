import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { Redirect, RouteComponentProps } from 'react-router-dom'

import { WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'
import Deposit from './index';
import AddLiquidity from './index'

export function RedirectDepositTokenId(
  props: RouteComponentProps<{ currencyIdA: string; currencyIdB: string; feeAmount?: string }>
) {
  const {
    match: {
      params: { currencyIdA, currencyIdB },
    },
  } = props

  const { chainId } = useActiveWeb3React()

  // prevent weth + eth
  const isETHOrWETHA =
    currencyIdA === 'ETH' || (chainId !== undefined && currencyIdA === WRAPPED_NATIVE_CURRENCY[chainId]?.address)
  const isETHOrWETHB =
    currencyIdB === 'ETH' || (chainId !== undefined && currencyIdB === WRAPPED_NATIVE_CURRENCY[chainId]?.address)

  if (
    currencyIdA &&
    currencyIdB &&
    (currencyIdA.toLowerCase() === currencyIdB.toLowerCase() || (isETHOrWETHA && isETHOrWETHB))
  ) {
    return <Redirect to={`/lend/${currencyIdA}`} />
  }
  console.log("two", props);
  return <Deposit {...props} />
}
