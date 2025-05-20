import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FunQuizModule = buildModule("FunQuizModule", (m) => {
  const funQuiz = m.contract("FunQuiz");

  return { funQuiz };
});

export default FunQuizModule;