import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import * as client from 'openid-client'

const server = new URL("https://localhost:7023")
const clientId = "client"
const clientSecret = ""

const config: client.Configuration = await client.discovery(
  server,
  clientId,
  clientSecret,
)

const authorize = async () => {
  /**
 * Value used in the authorization request as the redirect_uri parameter, this
 * is typically pre-registered at the Authorization Server.
 */
  const redirect_uri = "https://localhost:3006/"
  const scope = ""

  /**
   * PKCE: The following MUST be generated for every redirect to the
   * authorization_endpoint. You must store the code_verifier and state in the
   * end-user session such that it can be recovered as the user gets redirected
   * from the authorization server back to your application.
   */
  let code_verifier: string = client.randomPKCECodeVerifier()
  let code_challenge: string =
    await client.calculatePKCECodeChallenge(code_verifier)

  window.localStorage.setItem('pkce', code_verifier)

  let parameters: Record<string, string> = {
    redirect_uri,
    scope,
    code_challenge,
    code_challenge_method: 'S256',
  }

  let redirectTo: URL = client.buildAuthorizationUrl(config, parameters)

  // now redirect the user to redirectTo.href
  console.log('redirecting to', redirectTo.href)

  window.open(redirectTo.href, "_self")
}

const tokenRequest = async () => {
  let response: client.TokenEndpointResponse = await client.authorizationCodeGrant(
    config,
    new URL(window.location.href),
    {
      pkceCodeVerifier: window.localStorage.getItem('pkce') ?? '',
    },
  )

  return response.access_token
}

const getApiData = async (token: string) => {
  const data = await client.fetchProtectedResource(
    config,
    token,
    new URL(`${server}weatherforecast`),
    'GET',
  )

  return data.json()
}

function App() {
  const [code, setCode] = useState('')
  const [token, setToken] = useState('')
  const [apiData, setApiData] = useState('')
  const urlParams = new URLSearchParams(window.location.search)
  const authorizationCode = urlParams.get('code')

  if (authorizationCode && !code)
    setCode(authorizationCode)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button disabled={!!code || !!token} onClick={async () => await authorize()}>
          Authorize
        </button>
        <button disabled={!code || !!token} onClick={async () => setToken(await tokenRequest())}>
          Token
        </button>
        <button disabled={!token} onClick={async () => setApiData(await getApiData(token))}>
          Fetch API data
        </button>
        <p>
          {JSON.stringify(apiData)}
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
