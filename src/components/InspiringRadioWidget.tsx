import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Music, Volume2, Info } from 'lucide-react';

const FUN_FACTS = [
  "Did you know? Hedy Lamarr, a Hollywood actress, co-invented an early technique for spread spectrum communications and frequency hopping, which paved the way for modern Wi-Fi and Bluetooth.",
  "Fun fact: Dr. Shirley Jackson, the first African American woman to earn a doctorate from MIT, conducted breakthrough basic scientific research that enabled others to invent the portable fax, touch tone telephone, solar cells, and fiber optic cables.",
  "Did you know? Alan Turing, a brilliant mathematician who played a crucial role in cracking intercepted coded messages that enabled the Allies to defeat the Nazis, was also a pioneer in artificial intelligence.",
  "Fun fact: Rosalind Franklin's X-ray diffraction images of DNA were critical to the discovery of the DNA double helix, though her contribution was largely unrecognized during her lifetime.",
  "Did you know? Grace Hopper, a computer science pioneer, was one of the first programmers of the Harvard Mark I computer and invented the first compiler for a computer programming language.",
  "Fun fact: Marsha P. Johnson, a Black trans woman, was a prominent figure in the Stonewall uprising of 1969 and a tireless advocate for LGBTQ+ rights and homeless youth.",
  "Did you know? Katherine Johnson, a mathematician whose calculations of orbital mechanics as a NASA employee were critical to the success of the first and subsequent U.S. crewed spaceflights.",
  "Fun fact: Chien-Shiung Wu, a Chinese-American experimental physicist, made significant contributions in the field of nuclear physics and worked on the Manhattan Project, helping to develop the process for separating uranium into U-235 and U-238 isotopes by gaseous diffusion.",
  "Did you know? Mary Anning, an early 19th-century British fossil collector, dealer, and palaeontologist, became known around the world for important finds she made in Jurassic marine fossil beds in the cliffs along the English Channel.",
  "Fun fact: Bayard Rustin, an openly gay African American leader in social movements for civil rights, socialism, nonviolence, and gay rights, was the chief organizer of the 1963 March on Washington for Jobs and Freedom."
];

const STATIONS = [
  { id: 'drone', name: 'Ambient Drone (Generative)', type: 'generative' },
  { id: 'gta-pop', name: 'GTA 5 - Non-Stop-Pop FM', type: 'stream', url: 'https://stream.nightride.fm/nightride.m4a' },
  { id: 'gta-ls', name: 'GTA 5 - Radio Los Santos', type: 'stream', url: 'https://streams.ilovemusic.de/iloveradio13.mp3' },
  { id: 'gta-rock', name: 'GTA 5 - Los Santos Rock Radio', type: 'stream', url: 'https://streams.ilovemusic.de/iloveradio16.mp3' }
];

export function InspiringRadioWidget() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStation, setCurrentStation] = useState(STATIONS[0]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [factText, setFactText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generative "Music" (Ambient Drone)
  const toggleMusic = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playAudio(currentStation);
    }
  };

  const stopAudio = () => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.5);
      setTimeout(() => {
        oscillatorRef.current?.stop();
        oscillatorRef.current?.disconnect();
      }, 500);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
  };

  const playAudio = (station: typeof STATIONS[0]) => {
    stopAudio();
    
    if (station.type === 'generative') {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      // Ambient drone setup
      osc.type = 'sine';
      osc.frequency.value = 220; // A3

      filter.type = 'lowpass';
      filter.frequency.value = 400;

      // LFO for subtle modulation
      lfo.type = 'sine';
      lfo.frequency.value = 0.1; // Very slow
      lfoGain.gain.value = 50;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.setTargetAtTime(0.1, ctx.currentTime, 2); // Fade in

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      lfo.start();

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
    } else if (station.type === 'stream' && station.url) {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = station.url;
      audioRef.current.crossOrigin = "anonymous";
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }

    setIsPlaying(true);
    changeFact();
  };

  const handleStationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const station = STATIONS.find(s => s.id === e.target.value) || STATIONS[0];
    setCurrentStation(station);
    if (isPlaying) {
      playAudio(station);
    }
  };

  const changeFact = () => {
    const nextIndex = (currentFactIndex + 1) % FUN_FACTS.length;
    setCurrentFactIndex(nextIndex);
    typeFact(FUN_FACTS[nextIndex]);
  };

  const typeFact = (text: string) => {
    setIsTyping(true);
    setFactText('');
    let i = 0;
    const interval = setInterval(() => {
      setFactText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 30);
  };

  useEffect(() => {
    // Initial fact
    setFactText(FUN_FACTS[0]);
    
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  return (
    <div className="mt-auto p-4 border-t border-ink-dark/20 bg-paper-light">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Music size={14} className="text-moss" />
          <span className="text-xs font-sans font-semibold uppercase tracking-wider text-ink-muted">Inspire Radio</span>
        </div>
        <button 
          onClick={toggleMusic}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-moss text-paper-light shadow-md' : 'bg-paper-card border border-ink-dark/30 text-ink-muted hover:bg-paper-base'}`}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>
      </div>
      
      <div className="mb-3">
        <select 
          value={currentStation.id}
          onChange={handleStationChange}
          className="w-full bg-paper-base border border-ink-dark/20 text-ink-dark text-xs rounded px-2 py-1 focus:outline-none focus:border-moss"
        >
          {STATIONS.map(station => (
            <option key={station.id} value={station.id}>{station.name}</option>
          ))}
        </select>
      </div>

      <div className="relative bg-paper-base border border-ink-dark/20 rounded-storybook-sm p-3 overflow-hidden group shadow-storybook-inner">
        {isPlaying && (
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,var(--color-moss)_50%,transparent_100%)] animate-[pulse_4s_ease-in-out_infinite]"></div>
          </div>
        )}
        <div className="flex items-start gap-2 relative z-10">
          <Info size={14} className="text-sage shrink-0 mt-0.5" />
          <p className="text-xs font-sans text-ink-dark leading-relaxed min-h-[60px]">
            {factText}
            {isTyping && <span className="inline-block w-1.5 h-3 ml-1 bg-moss animate-pulse"></span>}
          </p>
        </div>
      </div>
    </div>
  );
}
