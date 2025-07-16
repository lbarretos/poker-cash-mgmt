"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Plus, 
  Minus,
  Clock,
  Coffee
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BlindLevel {
  id: string
  level: number
  smallBlind: number
  bigBlind: number
  ante?: number
  duration: number // em minutos
}

interface TimerConfig {
  gameMode: "cash" | "tournament"
  gameDuration: number // em minutos
  breakDuration: number // em minutos
  autoBreaks: boolean
  breakInterval: number // a cada quantas rodadas
  blindLevels: BlindLevel[]
  currentLevel: number
}

export function PokerTimer() {
  const { toast } = useToast()
  
  // Estados do cronômetro
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0) // em segundos
  const [currentPhase, setCurrentPhase] = useState<"game" | "break">("game")
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  

  
  // Configurações com persistência no localStorage
  const [config, setConfig] = useState<TimerConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('poker-timer-config')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    
    return {
      gameMode: "cash",
      gameDuration: 60, // 1 hora
      breakDuration: 15, // 15 minutos
      autoBreaks: false,
      breakInterval: 4, // a cada 4 níveis
      blindLevels: [
        { id: "1", level: 1, smallBlind: 5, bigBlind: 10, duration: 20 },
        { id: "2", level: 2, smallBlind: 10, bigBlind: 20, duration: 20 },
        { id: "3", level: 3, smallBlind: 15, bigBlind: 30, duration: 20 },
        { id: "4", level: 4, smallBlind: 25, bigBlind: 50, duration: 20 },
        { id: "5", level: 5, smallBlind: 50, bigBlind: 100, duration: 20 },
      ],
      currentLevel: 0
    }
  })
  
  // Salvar configurações no localStorage sempre que mudarem
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('poker-timer-config', JSON.stringify(config))
    }
  }, [config])
  
  // Restaurar estado do cronômetro na inicialização
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('poker-timer-state')
      if (savedState) {
        try {
          const state = JSON.parse(savedState)
          setTimeLeft(state.timeLeft || 0)
          setCurrentPhase(state.currentPhase || "game")
          setConfig(prev => ({ ...prev, currentLevel: state.currentLevel || 0 }))
        } catch (error) {
          console.log('Erro ao restaurar estado do cronômetro:', error)
        }
      }
    }
  }, [])
  
  // Salvar estado do cronômetro
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timerState = {
        timeLeft,
        currentPhase,
        isRunning: false, // Sempre pausar ao recarregar por segurança
        currentLevel: config.currentLevel
      }
      localStorage.setItem('poker-timer-state', JSON.stringify(timerState))
    }
  }, [timeLeft, currentPhase, config.currentLevel])
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Inicializar tempo baseado na configuração
  useEffect(() => {
    if (config.gameMode === "cash") {
      setTimeLeft(config.gameDuration * 60)
    } else {
      const currentBlind = config.blindLevels[config.currentLevel]
      if (currentBlind) {
        setTimeLeft(currentBlind.duration * 60)
      }
    }
  }, [config.gameMode, config.gameDuration, config.currentLevel, config.blindLevels])
  
  // Lógica do cronômetro
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeExpired()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])
  
  const handleTimeExpired = () => {
    setIsRunning(false)
    
    if (config.gameMode === "tournament") {
      if (currentPhase === "game") {
        // Verificar se deve ter intervalo
        const shouldBreak = config.autoBreaks && 
          (config.currentLevel + 1) % config.breakInterval === 0 &&
          config.currentLevel + 1 < config.blindLevels.length
        
        if (shouldBreak) {
          setCurrentPhase("break")
          setTimeLeft(config.breakDuration * 60)
          toast({
            title: "Intervalo!",
            description: `Nível ${config.currentLevel + 1} concluído. Hora do intervalo!`,
          })
        } else {
          // Próximo nível
          nextLevel()
        }
      } else {
        // Fim do intervalo
        setCurrentPhase("game")
        nextLevel()
        toast({
          title: "Fim do intervalo",
          description: "Vamos para o próximo nível!",
        })
      }
    } else {
      toast({
        title: "Tempo esgotado!",
        description: "A sessão de cash game terminou.",
      })
    }
  }
  
  const nextLevel = () => {
    const newLevel = config.currentLevel + 1
    if (newLevel < config.blindLevels.length) {
      setConfig(prev => ({ ...prev, currentLevel: newLevel }))
      setTimeLeft(config.blindLevels[newLevel].duration * 60)
      toast({
        title: `Nível ${newLevel + 1}`,
        description: `Blinds: ${config.blindLevels[newLevel].smallBlind}/${config.blindLevels[newLevel].bigBlind}`,
      })
    } else {
      toast({
        title: "Torneio finalizado!",
        description: "Todos os níveis foram concluídos.",
      })
    }
  }
  
  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }
  
  const resetTimer = () => {
    setIsRunning(false)
    setCurrentPhase("game")
    setConfig(prev => ({ ...prev, currentLevel: 0 }))
    
    if (config.gameMode === "cash") {
      setTimeLeft(config.gameDuration * 60)
    } else {
      setTimeLeft(config.blindLevels[0]?.duration * 60 || 1200)
    }
  }
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  const getCurrentBlind = () => {
    if (config.gameMode === "tournament" && config.blindLevels[config.currentLevel]) {
      return config.blindLevels[config.currentLevel]
    }
    return null
  }
  
  const addBlindLevel = () => {
    const newLevel = {
      id: Date.now().toString(),
      level: config.blindLevels.length + 1,
      smallBlind: 25,
      bigBlind: 50,
      duration: 20
    }
    setConfig(prev => ({
      ...prev,
      blindLevels: [...prev.blindLevels, newLevel]
    }))
  }
  
  const removeBlindLevel = (id: string) => {
    setConfig(prev => ({
      ...prev,
      blindLevels: prev.blindLevels.filter(level => level.id !== id)
    }))
  }
  
  const updateBlindLevel = (id: string, updates: Partial<BlindLevel>) => {
    setConfig(prev => ({
      ...prev,
      blindLevels: prev.blindLevels.map(level => 
        level.id === id ? { ...level, ...updates } : level
      )
    }))
  }
  
  const currentBlind = getCurrentBlind()
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cronômetro do Jogo
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={config.gameMode === "cash" ? "default" : "secondary"}>
              {config.gameMode === "cash" ? "Cash Game" : "Campeonato"}
            </Badge>
            {currentPhase === "break" && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Coffee className="h-3 w-3" />
                Intervalo
              </Badge>
            )}
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Configurações do Cronômetro</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="general" className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="blinds">Blinds</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general" className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <Label>Modo de Jogo</Label>
                        <Select 
                          value={config.gameMode} 
                          onValueChange={(value: "cash" | "tournament") => 
                            setConfig(prev => ({ ...prev, gameMode: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash Game</SelectItem>
                            <SelectItem value="tournament">Campeonato</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {config.gameMode === "cash" ? (
                        <div>
                          <Label>Duração da Sessão (minutos)</Label>
                          <Input
                            type="number"
                            value={config.gameDuration}
                            onChange={(e) => setConfig(prev => ({ 
                              ...prev, 
                              gameDuration: parseInt(e.target.value) || 60 
                            }))}
                          />
                        </div>
                      ) : (
                        <>
                          <div>
                            <Label>Duração do Intervalo (minutos)</Label>
                            <Input
                              type="number"
                              value={config.breakDuration}
                              onChange={(e) => setConfig(prev => ({ 
                                ...prev, 
                                breakDuration: parseInt(e.target.value) || 15 
                              }))}
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="autoBreaks"
                              checked={config.autoBreaks}
                              onChange={(e) => setConfig(prev => ({ 
                                ...prev, 
                                autoBreaks: e.target.checked 
                              }))}
                            />
                            <Label htmlFor="autoBreaks">Intervalos automáticos</Label>
                          </div>
                          
                          {config.autoBreaks && (
                            <div>
                              <Label>Intervalo a cada (níveis)</Label>
                              <Input
                                type="number"
                                value={config.breakInterval}
                                onChange={(e) => setConfig(prev => ({ 
                                  ...prev, 
                                  breakInterval: parseInt(e.target.value) || 4 
                                }))}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="blinds" className="space-y-4">
                    {config.gameMode === "tournament" ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Estrutura de Blinds</h4>
                          <Button onClick={addBlindLevel} size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                        
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {config.blindLevels.map((level, index) => (
                            <div key={level.id} className="grid grid-cols-6 gap-2 items-center p-2 border rounded">
                              <div className="text-sm font-medium">Nv. {level.level}</div>
                              <Input
                                type="number"
                                placeholder="Small"
                                value={level.smallBlind}
                                onChange={(e) => updateBlindLevel(level.id, { 
                                  smallBlind: parseInt(e.target.value) || 0 
                                })}
                                className="text-xs"
                              />
                              <Input
                                type="number"
                                placeholder="Big"
                                value={level.bigBlind}
                                onChange={(e) => updateBlindLevel(level.id, { 
                                  bigBlind: parseInt(e.target.value) || 0 
                                })}
                                className="text-xs"
                              />
                              <Input
                                type="number"
                                placeholder="Ante"
                                value={level.ante || ""}
                                onChange={(e) => updateBlindLevel(level.id, { 
                                  ante: e.target.value ? parseInt(e.target.value) : undefined 
                                })}
                                className="text-xs"
                              />
                              <Input
                                type="number"
                                placeholder="Min"
                                value={level.duration}
                                onChange={(e) => updateBlindLevel(level.id, { 
                                  duration: parseInt(e.target.value) || 20 
                                })}
                                className="text-xs"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeBlindLevel(level.id)}
                                disabled={config.blindLevels.length <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        Configuração de blinds disponível apenas para campeonatos
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                
                <DialogFooter>
                  <Button onClick={() => setIsConfigOpen(false)}>
                    Fechar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cronômetro Principal */}
          <div className="lg:col-span-2">
            <div className="text-center space-y-4">
              <div className="text-6xl lg:text-7xl font-mono font-bold">
                {formatTime(timeLeft)}
              </div>
              
              <div className="flex justify-center gap-3">
                <Button 
                  onClick={toggleTimer} 
                  size="lg"
                  variant={isRunning ? "secondary" : "default"}
                  className="flex items-center gap-2"
                >
                  {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {isRunning ? "Pausar" : "Iniciar"}
                </Button>
                
                <Button onClick={resetTimer} variant="outline" size="lg">
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Reiniciar
                </Button>
              </div>
            </div>
          </div>
          
          {/* Informações Laterais */}
          <div className="space-y-4">
            {config.gameMode === "tournament" && currentBlind && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    Nível {currentBlind.level}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Small Blind:</span>
                      <span className="font-mono">R$ {currentBlind.smallBlind}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Big Blind:</span>
                      <span className="font-mono">R$ {currentBlind.bigBlind}</span>
                    </div>
                    {currentBlind.ante && (
                      <div className="flex justify-between">
                        <span>Ante:</span>
                        <span className="font-mono">R$ {currentBlind.ante}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {config.gameMode === "tournament" && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Próximos Níveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    {config.blindLevels.slice(config.currentLevel + 1, config.currentLevel + 4).map(level => (
                      <div key={level.id} className="flex justify-between">
                        <span>Nv. {level.level}:</span>
                        <span>{level.smallBlind}/{level.bigBlind}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 