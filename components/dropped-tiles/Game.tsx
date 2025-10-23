'use client';

import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';


// --- CONSTANTES DEL JUEGO ---
const NUM_LANES = 4;
const TILE_HEIGHT = 150;
const TILE_COLORS = ['#38bdf8', '#fb7185', '#a78bfa', '#4ade80'];
const HIT_ZONE_HEIGHT = 300;
const LOSS_TOLERANCE_PERCENT = 0.20;

// --- DATOS DE LA CANCIÓN ---
import furElise from '../../scores/json/fur_elise.json';

type MidiDataEntry = [number, number, number, string]; // [time, lane, duration, noteName]
const SAMPLE_MIDI_DATA: MidiDataEntry[] = furElise as MidiDataEntry[];

// --- COMPONENTE DEL JUEGO ---
export default function DroppedTilesGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameWrapperRef = useRef<HTMLDivElement>(null);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<'idle' | 'running' | 'gameOver' | 'victory'>('idle');

    const tiles = useRef<any[]>([]);
    const gameSpeed = useRef(0.6);
    const lastTime = useRef(0);
    const gameTime = useRef(0);
    const noteIndex = useRef(0);
    const synth = useRef<Tone.PolySynth | null>(null);

    // --- LÓGICA DEL JUEGO PORTADA A REACT ---

    // Inicialización del audio
    const setupAudio = () => {
        if (!synth.current) {
            synth.current = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "triangle" },
                envelope: {
                    attack: 0.005,
                    decay: 0.1,
                    sustain: 0.1,
                    release: 0.2
                }
            }).toDestination();
        }
    };

    // Clase Tile adaptada
    class Tile {
        lane: number;
        targetTime: number;
        height: number;
        width: number;
        color: string;
        isHit: boolean;
        y: number;
        ctx: CanvasRenderingContext2D;
        duration: number;
        noteName: string; // Nueva propiedad para el nombre de la nota

        constructor(lane: number, targetTime: number, duration: number, noteName: string, canvas: HTMLCanvasElement, initialGameTime: number, ctx: CanvasRenderingContext2D) {
            this.lane = lane;
            this.targetTime = targetTime;
            this.height = TILE_HEIGHT;
            this.width = canvas.width / NUM_LANES;
            this.color = TILE_COLORS[lane];
            this.isHit = false;
            this.ctx = ctx;
            this.duration = duration;
            this.noteName = noteName; // Asignar el nombre de la nota

            const distanceToTarget = canvas.height - HIT_ZONE_HEIGHT;
            const timeToFall = distanceToTarget / gameSpeed.current;
            const timeToStartFalling = targetTime - timeToFall;
            const elapsedTimeSinceStart = initialGameTime - timeToStartFalling;
            this.y = -TILE_HEIGHT + (elapsedTimeSinceStart * gameSpeed.current);
        }

        update(deltaTime: number) {
            if (!this.isHit) {
                this.y += gameSpeed.current * deltaTime;
            }
        }

        draw(canvas: HTMLCanvasElement) {
            if (this.isHit) return;

            const x = this.lane * this.width;
            const ctx = this.ctx;

            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 5;

            ctx.fillStyle = this.color;
            ctx.fillRect(x, this.y, this.width, this.height);

            ctx.strokeStyle = '#e4f4f7';
            ctx.lineWidth = 4;
            ctx.strokeRect(x, this.y, this.width, this.height);

            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        static drawHitZone(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
            ctx.shadowColor = '#4c1d95';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(0, canvas.height - HIT_ZONE_HEIGHT, canvas.width, HIT_ZONE_HEIGHT);

            ctx.strokeStyle = '#6d28d9';
            ctx.lineWidth = 6;
            ctx.strokeRect(0, canvas.height - HIT_ZONE_HEIGHT, canvas.width, HIT_ZONE_HEIGHT);

            ctx.shadowBlur = 0;
        }

        checkHit(x: number, y: number, canvas: HTMLCanvasElement) {
            const laneWidth = canvas.width / NUM_LANES;
            const minX = this.lane * laneWidth;
            const maxX = minX + laneWidth;

            const isInHitZone = y >= canvas.height - HIT_ZONE_HEIGHT && y <= canvas.height;

            if (!this.isHit && x >= minX && x < maxX && isInHitZone) {
                const tileMinY = this.y;
                const tileMaxY = this.y + this.height;

                if (y >= tileMinY && y <= tileMaxY) {
                    this.isHit = true;
                    return true;
                }
            }
            return false;
        }

        isPastLossLine(canvas: HTMLCanvasElement) {
            const lossTolerance = this.height * LOSS_TOLERANCE_PERCENT;
            return !this.isHit && this.y > canvas.height + lossTolerance;
        }
    }
    
    const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        ctx.fillStyle = '#0d0d18';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        Tile.drawHitZone(ctx, canvas);

        const laneWidth = canvas.width / NUM_LANES;
        ctx.strokeStyle = '#4c1d95';
        ctx.lineWidth = 2;
        for (let i = 1; i < NUM_LANES; i++) {
            const x = i * laneWidth;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        tiles.current.sort((a, b) => a.y - b.y);
        tiles.current.forEach(tile => tile.draw(canvas));
    };

    const scheduleNextNotes = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        const distanceToTarget = canvas.height - HIT_ZONE_HEIGHT;
        const timeToFall = distanceToTarget / gameSpeed.current;

        while (noteIndex.current < SAMPLE_MIDI_DATA.length) {
            const [noteTime, lane, duration, noteName] = SAMPLE_MIDI_DATA[noteIndex.current];

            // La marca de fin de la canción ahora puede venir con un noteName, pero el lane 999 sigue siendo el indicador.
            if (lane === 999) {
                noteIndex.current++;
                return;
            }

            const timeToStartFalling = noteTime - timeToFall;

            if (timeToStartFalling <= gameTime.current) {
                tiles.current.push(new Tile(lane, noteTime, duration, noteName, canvas, gameTime.current, ctx));
                noteIndex.current++;
            } else {
                break;
            }
        }
    };

    const update = (deltaTime: number, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        scheduleNextNotes(canvas, ctx);

        let lost = false;
        tiles.current.forEach(tile => {
            tile.update(deltaTime);
            if (tile.isPastLossLine(canvas)) {
                lost = true;
            }
        });

        tiles.current = tiles.current.filter(tile => !tile.isHit && tile.y < canvas.height + TILE_HEIGHT);

        if (lost) {
            setGameState('gameOver');
        } else if (noteIndex.current >= SAMPLE_MIDI_DATA.length && tiles.current.length === 0) {
            setGameState('victory');
        }
    };
    
    const gameLoop = () => {
        if (gameState !== 'running' || !canvasRef.current) return;
    
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTime.current;
        lastTime.current = currentTime;
    
        gameTime.current += deltaTime;
    
        update(deltaTime, canvas, ctx);
        draw(ctx, canvas);
    
        requestAnimationFrame(gameLoop);
    };

    const handleInput = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (gameState !== 'running' || !canvasRef.current || !synth.current) return;
    
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const inputs = [];
    
        if ('touches' in event) {
            for (let i = 0; i < event.touches.length; i++) {
                inputs.push({
                    x: event.touches[i].clientX - rect.left,
                    y: event.touches[i].clientY - rect.top
                });
            }
        } else {
            inputs.push({
                x: event.nativeEvent.offsetX,
                y: event.nativeEvent.offsetY
            });
        }
    
        if (event.cancelable) event.preventDefault();
    
        inputs.forEach(input => {
            let tileHitForThisInput = false;
            let tileLanes: number[] = [];
    
            for (let i = tiles.current.length - 1; i >= 0; i--) {
                const tile = tiles.current[i];
                if (tile.checkHit(input.x, input.y, canvas)) {
                    tileHitForThisInput = true;
                    tileLanes.push(tile.lane);
                    setScore(prev => prev + 10);
                    break;
                }
            }
    
            if (tileHitForThisInput) {
                // Ahora la nota se obtiene directamente de la ficha golpeada
                const hitTile: Tile | undefined = tiles.current.find(tile => tile.isHit); // Encuentra la ficha que fue golpeada
                if (hitTile) {
                    synth.current?.triggerAttackRelease(hitTile.noteName, hitTile.duration /1000, Tone.now());
                }
            }
        });
    };

    const startGame = async () => {
        await Tone.start();
        setupAudio();
    
        gameTime.current = 0;
        noteIndex.current = 0;
        tiles.current = [];
        setScore(0);
        setGameState('running');
    
        lastTime.current = performance.now();
        requestAnimationFrame(gameLoop);
    };

    const handleRestart = () => {
        startGame();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        const resizeCanvas = () => {
            if (canvas && gameWrapperRef.current) {
                canvas.width = gameWrapperRef.current.clientWidth;
                canvas.height = gameWrapperRef.current.clientHeight;
                if (ctx && gameState !== 'running') {
                    draw(ctx, canvas);
                }
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        if (ctx && canvas && gameState !== 'running') {
            draw(ctx, canvas);
        }

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [gameState]);

    useEffect(() => {
        if (gameState === 'running') {
            requestAnimationFrame(gameLoop);
        }
    }, [gameState]);


    return (
        <div ref={gameWrapperRef} id="game-wrapper" className="fixed top-0 left-0 w-full h-full">
            <canvas ref={canvasRef} id="pianoTilesCanvas" className="block bg-gray-900 w-full h-full" onClick={handleInput} onTouchStart={handleInput}></canvas>

            <div id="scoreDisplay" className="overlay-item fixed top-4 right-4 bg-gray-700 text-yellow-300 p-3 rounded-xl font-mono text-xl shadow-lg z-10">
                Puntaje: {score}
            </div>

            {gameState === 'idle' && (
                <div id="startOverlay" className="overlay-item fixed inset-0 flex items-center justify-center z-20">
                    <button id="startButton" onClick={startGame} className="btn-primary bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-10 text-xl rounded-xl">
                        Toca para Iniciar
                    </button>
                </div>
            )}

            {(gameState === 'gameOver' || gameState === 'victory') && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-30">
                    <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl text-center w-11/12 max-w-sm">
                        {gameState === 'gameOver' ? (
                            <>
                                <h2 className="text-4xl font-extrabold text-red-400 mb-4">¡Juego Terminado!</h2>
                                <p className="text-xl text-white mb-6">Tu puntaje final es: <span className="font-bold text-yellow-300">{score}</span></p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-4xl font-extrabold text-green-400 mb-4">¡Enhorabuena!</h2>
                                <p className="text-xl text-white mb-6">¡Completaste la canción! Puntaje total: <span className="font-bold text-yellow-300">{score}</span></p>
                            </>
                        )}
                        <button onClick={handleRestart} className="btn-primary bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl">
                            Jugar de Nuevo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
