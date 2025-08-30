import QuizCreator from '../components/QuizCreator';
import { Quiz } from '../types';
import { useQuiz } from '../context/QuizContext';
import { useNavigate } from 'react-router-dom';

const GeneratePDF = () => {
  const { setActiveQuiz } = useQuiz();
  const navigate = useNavigate();

  const handleQuizGenerated = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    navigate('/quiz');
  };

  return (
    <QuizCreator
      creationMode="pdf"
      onQuizGenerated={handleQuizGenerated}
      onBackToChoice={() => window.history.back()}
    />
  );
};

export default GeneratePDF;