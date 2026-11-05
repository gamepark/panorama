import { PanoramaAI } from '@gamepark/panorama/ai/PanoramaAI'
import { PanoramaOptionsSpecV2 } from '@gamepark/panorama/PanoramaOptions'
import { PanoramaRules } from '@gamepark/panorama/PanoramaRules'
import { PanoramaSetup } from '@gamepark/panorama/PanoramaSetup'
import { GameProvider } from '@gamepark/react-game'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { gameAnimations } from './animations/GameAnimations'
import { App } from './App'
import { Locators } from './locators/Locators'
import { Material } from './material/Material'
import { theme } from './theme'
import { PanoramaScoring } from './scoring/PanoramaScoring'
import { PanoramaTutorial } from './tutorial/PanoramaTutorial'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider
      game="panorama"
      Rules={PanoramaRules}
      optionsSpec={PanoramaOptionsSpecV2}
      GameSetup={PanoramaSetup}
      ai={PanoramaAI}
      material={Material}
      locators={Locators}
      animations={gameAnimations}
      scoring={new PanoramaScoring()}
      tutorial={new PanoramaTutorial()}
      theme={theme}
    >
      <App />
    </GameProvider>
  </StrictMode>
)
