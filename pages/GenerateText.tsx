import QuizCreator from '../components/QuizCreator';
import { Quiz } from '../types';
import { useQuiz } from '../context/QuizContext';
import { useNavigate } from 'react-router-dom';

const GenerateText = () => {
  const { setActiveQuiz } = useQuiz();
  const navigate = useNavigate();

  const handleQuizGenerated = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    navigate('/quiz');
  };

  return (
    <QuizCreator
      creationMode="text"
      onQuizGenerated={handleQuizGenerated}
      onBackToChoice={() => window.history.back()}
    />
  );
};

export default GenerateText;