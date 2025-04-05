### Padrões de Projeto aplicados

1. **Singleton** :

- `ResponseHandler.getInstance()`
- O ConnectionManager é instanciado uma vez no entrypoint

1. **Strategy** :

- Diferentes implementações de comandos (`StringCommands`, `ListCommands`, etc.)

```tsx
// commands/index.ts
export function createCommandServices(
  store: DataStore
): Record<string, ICommandService> {
  return {
    string: new StringCommandService(store),
    list: new ListCommandService(store),
    // ...
  };
}
```

1. **Command** :

- Cada comando (SET, GET, LPUSH) é encapsulado como um objeto

```tsx
// CommandService.ts
export interface ICommandService {
  execute(args: string[], socket: Socket): Promise<void>;
}
```

1. **Observer** :

- ConnectionManager monitora eventos de conexão (data, end, error).
- Outro uso é no DataStore: gerenciador de expiração verificando keys periodicamente.

```tsx
// DataStore.ts
setInterval(() => this.cleanupExpiredKeys(), 300000);
```

1. **Facade** :

- `RESPProcessor` escondendo a complexidade do protocolo RESP

```tsx
   // RESPProcessor.ts
   public process(input: string, socket: Socket): void {
     // ...
     this.executeCommand(command, args, socket);
   }

```

### Princípios SOLID Aplicados

**Single Responsibility** :

- Cada classe tem uma única responsabilidade clara:
  - `DataStore`: Armazenamento
  - `RESPProcessor`: Processamento de protocolo
  - `StringCommandService`: Lógica de comandos string

**Open/Closed** :

- Novos comandos podem ser adicionados sem modificar o processador existente

```tsx
// Para adicionar novo comando:
class NewCommand implements ICommandService {
  execute(args: string[], socket: Socket) {
    /* ... */
  }
}
```

**Liskov Substitution** :

- Todos os comandos implementam `ICommandService` podendo ser substituídos

```tsx
// commands/index.ts
const services = {
  newcmd: new NewCommand(store), // Compatível com existentes
};
```

**Interface Segregation** :

- Múltiplas interfaces específicas (`ICommandService`, `IResponseFormatter`)

**Dependency Inversion** :

- Dependências injetadas via construtor:

```tsx
   // StringCommandService.ts
   constructor(private store: DataStore) {}

```
