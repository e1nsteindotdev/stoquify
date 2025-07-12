function waitFor(n: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(n), n * 1000)
  })
}

async function Work(n: number) {
  console.log('work running for :', n)
  if (n == 4) {
    throw "4 sucks"
  } else {
    await waitFor(n);
    console.log('worked resolved for :', n)
    return n ** 2;
  }
}

async function Main() {
  try {
    const promises = [1, 2, 3, 4, 5].map((i) => Work(i))
    console.log("going to initialize result")
    const result = await Promise.all(promises)
    console.log('Promise.all finished and here is the results :', result)
  } catch (e) {
    console.log("MAIN failed for the reason : ", e)
  }
}


Main()
export default Main;

