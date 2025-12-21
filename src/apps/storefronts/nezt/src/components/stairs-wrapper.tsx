import { motion } from "motion/react"
export function StairsWrapper({ children }: { children: React.ReactNode }) {
  return <div className="relative overflow-hidden">
    <div
      className="fixed flex left-0 top-0 h-screen w-screen z-100 pointer-none" style={{ pointerEvents: "none" }}>
      {[1, 2, 3, 4, 5].map((i, index) => (
        <motion.div
          key={index}
          initial={{ top: 0 }}
          animate={{
            top: '100%',
            transition: { duration: 1, delay: index * .05 },
            transitionEnd: {
              height: 0,
              top: 0
            }
          }}
          exit={{
            height: "100%",
            transition: {
              duration: .4,
              delay: 0.05 * i
            }
          }}
          className="relative bg-primary h-full w-full" />
      ))}
    </div>
    {children}
  </div >

}
