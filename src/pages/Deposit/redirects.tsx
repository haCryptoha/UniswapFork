import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { Redirect, RouteComponentProps } from 'react-router-dom'

import { WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'
import Deposit from './index';

export function RedirectDepositTokenId(
  props: RouteComponentProps<{  currencyIdB: string; feeAmount?: string }>
) {
  const {
    match: {
      params: {  currencyIdB },
    },
  } = props

  const { chainId } = useActiveWeb3React() 
  
  return <Deposit {...props} />
}
