import { Alert, Button, Card, CardContent, CardMedia, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { createAPIEndpoint, ENDPOINTS } from '../api';
import { getFormatedTime } from '../helper';
import useStateContext from '../hooks/useStateContext';
import { green } from '@mui/material/colors';
import Answer from './Answer';
import Confetti from 'react-confetti'; // Import Confetti component

export default function Result() {
    const { context, setContext } = useStateContext();
    const [score, setScore] = useState(0);
    const [qnAnswers, setQnAnswers] = useState([]);
    const [showAlert, setShowAlert] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false); // State to control confetti visibility
    const navigate = useNavigate();

    useEffect(() => {
        const ids = context.selectedOptions.map(x => x.qnId);
        createAPIEndpoint(ENDPOINTS.getAnswers)
            .post(ids)
            .then(res => {
                const qna = context.selectedOptions.map(x => ({
                    ...x,
                    ...(res.data.find(y => y.qnId === x.qnId))
                }));
                setQnAnswers(qna);
                calculateScore(qna);
            })
            .catch(err => console.log(err));
    }, []);

    useEffect(() => {
      if (showConfetti) {
          const timer = setTimeout(() => {
              setShowConfetti(false);
          }, 8000);
          return () => clearTimeout(timer);
      }
  }, [showConfetti]);

    const calculateScore = qna => {
        const tempScore = qna.reduce((acc, curr) => {
            return curr.answer === curr.selected ? acc + 1 : acc;
        }, 0);
        setScore(tempScore);
        if (tempScore === 5) {
            setShowConfetti(true); // Show confetti if score is 5
        }
    };

    const restart = () => {
        setContext({
            timeTaken: 0,
            selectedOptions: []
        });
        navigate("/quiz");
    };

    const submitScore = () => {
        createAPIEndpoint(ENDPOINTS.participant)
            .put(context.participantId, {
                participantId: context.participantId,
                score: score,
                timeTaken: context.timeTaken
            })
            .then(res => {
                setShowAlert(true);
                setTimeout(() => {
                    setShowAlert(false);
                }, 4000);
            })
            .catch(err => { console.log(err) });
    };

    return (
        <>
            {showConfetti && <Confetti />} {/* Show confetti if showConfetti is true */}
            <Card sx={{ mt: 5, display: 'flex', width: '100%', maxWidth: 640, mx: 'auto' }}>
                {/* Your existing card content */}
                <CardContent sx={{ flex: '1 0 auto', textAlign: 'center' }}>
                    <Typography variant="h4">Congratulations!</Typography>
                    <Typography variant="h6">
                        YOUR SCORE
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        <Typography variant="span" color={green[500]}>
                            {score}
                        </Typography>/5
                    </Typography>
                    <Typography variant="h6">
                        Took {getFormatedTime(context.timeTaken) + ' mins'}
                    </Typography>
                    <Button variant="contained"
                        sx={{ mx: 1 }}
                        size="small"
                        onClick={submitScore}>
                        Submit
                    </Button>
                    <Button variant="contained"
                        sx={{ mx: 1 }}
                        size="small"
                        onClick={restart}>
                        Re-try
                    </Button>
                    <Alert
                        severity="success"
                        variant="string"
                        sx={{
                            width: '60%',
                            m: 'auto',
                            visibility: showAlert ? 'visible' : 'hidden'
                        }}>
                        Score Updated.
                    </Alert>
                </CardContent>
                <CardMedia
          component="img"
          sx={{ width: 220 }}
          image="./result.png"
        />
            </Card>
            <Answer qnAnswers={qnAnswers} />
        </>
    );
}
