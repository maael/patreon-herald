import '~/styles/main.css'
import Head from 'next/head'
import { AppProps } from 'next/app'
import { DefaultSeo } from 'next-seo'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import useFathom from '~/components/hooks/useFathom'
import SEO from '~/../next-seo.config'
import EmojiFavicon from '~/components/primitives/EmojiFavicon'
import Header from '~/components/primitives/Header'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchInterval: 0, refetchOnMount: false, refetchOnReconnect: false, refetchOnWindowFocus: false },
  },
})

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  useFathom()
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#fd015d" />
        </Head>
        <DefaultSeo {...SEO} />
        <Header />
        <Component {...pageProps} />
        <EmojiFavicon emoji="🤖" />
      </SessionProvider>
    </QueryClientProvider>
  )
}

export default App
