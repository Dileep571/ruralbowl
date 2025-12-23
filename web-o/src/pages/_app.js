import { StoreProvider } from '../providers/StoreProvider'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <StoreProvider>
      <Component {...pageProps} />
    </StoreProvider>
  )
}