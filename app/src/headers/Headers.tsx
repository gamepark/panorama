import { RuleId } from '@gamepark/panorama/rules/RuleId'
import { ComponentType } from 'react'
import { MoveBalloonHeader } from './MoveBalloonHeader'
import { PlaceTileHeader } from './PlaceTileHeader'

export const Headers: Partial<Record<RuleId, ComponentType>> = {
  [RuleId.MoveBalloon]: MoveBalloonHeader,
  [RuleId.PlaceTile]: PlaceTileHeader
}
