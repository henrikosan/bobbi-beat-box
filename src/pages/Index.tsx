import React from 'react';
import BobbiCussion from '../components/BobbiCussion';

const Index = () => {
  console.log('Index component rendering...');
  return (
    <div>
      <h1 style={{color: 'white', padding: '20px'}}>Loading BobbiCussion...</h1>
      <BobbiCussion />
    </div>
  );
};

export default Index;