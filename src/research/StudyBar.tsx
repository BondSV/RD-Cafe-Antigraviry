import React from 'react';
import {flush,useRecording} from './recording';
export default function StudyBar(){
 const {error,storageError}=useRecording();
 if(!error&&!storageError)return null;
 return <aside className="study-recording-error" role="alert"><span>{error||'Browser storage is full.'} Unsent gameplay is waiting on this device. Keep this tab open until it is saved.</span><button onClick={()=>void flush()}>Retry saving</button></aside>;
}
