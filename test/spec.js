global.window = global // mock

const test = require('tape')
const sinon = require('sinon')

const detectProvider = require('..')

// test mocking utility
const mockWindowProps = (ethereum) => {
  window.addEventListener = sinon.fake()
  window.removeEventListener = sinon.fake()
  if (ethereum) {
    window.ethereum = ethereum
  } else {
    delete window.ethereum
  }
}

// different mock providers
const providerWithMetaMask = {
  isMetaMask: true,
}
const providerNoMetaMask = {}
const noProvider = null

// error messages
const noEthereumErrorMessage = 'Unable to detect window.ethereum.'
const noMetaMaskErrorMessage = 'Non-MetaMask window.ethereum detected.'

test('detectProvider: defaults with ethereum already set', async function (t) {

  mockWindowProps(providerNoMetaMask)

  await detectProvider()

  t.ok(window.addEventListener.notCalled, 'addEventListener should not have been called')
  t.ok(window.removeEventListener.notCalled, 'removeEventListener should not have been called')
  t.end()
})

test('detectProvider: mustBeMetamask with ethereum already set', async function (t) {

  mockWindowProps(providerWithMetaMask)

  const provider = await detectProvider()

  t.ok(provider.isMetaMask, 'should have resolved expected provider object')
  t.ok(window.addEventListener.notCalled, 'addEventListener should not have been called')
  t.ok(window.removeEventListener.notCalled, 'removeEventListener should not have been called')
  t.end()
})

test('detectProvider: mustBeMetamask with non-MetaMask ethereum already set', async function (t) {

  mockWindowProps(providerNoMetaMask)

  try {
    await detectProvider({ timeout: 1, mustBeMetaMask: true })
    t.fail('should have thrown error')
  } catch (error) {
    t.ok(window.addEventListener.notCalled, 'addEventListener should not have been called')
    t.ok(window.removeEventListener.notCalled, 'removeEventListener should not have been called')
    t.ok(error.message === noMetaMaskErrorMessage, 'error should have expected message')
    t.end()
  }
})

test('detectProvider: ethereum set on ethereum#initialized', async function (t) {

  mockWindowProps(noProvider)
  const clock = sinon.useFakeTimers()

  const detectPromise = detectProvider({ timeout: 1 })

  // set ethereum and call event handler as though event was dispatched
  window.ethereum = providerWithMetaMask
  window.addEventListener.lastCall.args[1]()

  // advance clock to ensure nothing blows up
  clock.tick(1)
  clock.tick(1)

  const provider = await detectPromise

  t.ok(provider.isMetaMask, 'should have resolved expected provider object')
  t.ok(window.addEventListener.calledOnce, 'addEventListener should have been called once')
  t.ok(window.removeEventListener.calledOnce, 'removeEventListener should have been called once')

  clock.restore()
  t.end()
})

test('detectProvider: ethereum set at end of timeout', async function (t) {

  mockWindowProps(noProvider)
  const clock = sinon.useFakeTimers()

  const detectPromise = detectProvider({ timeout: 1 })

  // set ethereum
  window.ethereum = providerWithMetaMask

  // advance clock to trigger timeout function
  clock.tick(1)

  const provider = await detectPromise

  t.ok(provider.isMetaMask, 'should have resolved expected provider object')
  t.ok(window.addEventListener.calledOnce, 'addEventListener should have been called once')
  t.ok(window.removeEventListener.calledOnce, 'removeEventListener should have been called once')

  clock.restore()
  t.end()
})

test('detectProvider: ethereum never set', async function (t) {

  mockWindowProps(noProvider)

  try {
    await detectProvider({ timeout: 1 })
    t.fail('should have thrown error')
  } catch (error) {
    t.ok(window.addEventListener.calledOnce, 'addEventListener should have been called once')
    t.ok(window.removeEventListener.calledOnce, 'removeEventListener should have been called once')
    t.ok(error.message === noEthereumErrorMessage, 'error should have expected message')
    t.end()
  }
})
