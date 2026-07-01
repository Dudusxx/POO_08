# __Resoluções da Atividade 8.1__

## 1ª Questão

Excluindo o uso tradicional de exceções, as estratégias mais comuns para lidar com falhas no código são:

**1. Checagem de Retorno (Códigos de Erro)**

A função comunica se a operação foi bem-sucedida ou não através do valor que ela devolve ao final da execução (por exemplo, retornando `true/false`, `null` ou um número como `-1`). Fica a cargo do trecho de código que chamou a função testar esse resultado antes de dar o próximo passo.

```typescript
public bankDeposit(value: number, accNumber: string): boolean {
    const accountIndex: number | undefined = this.getAccountIndexByNumber(accNumber);

    if (accountIndex != undefined) { 
        this._accounts[accountIndex].deposit(value);
        return true;
    }
    return false;
}
```

---

**2. Utilização de blocos `try-catch`**

O bloco `try` encapsula o trecho de código considerado "arriscado". Se qualquer erro "estourar" ali dentro, o fluxo de execução é desviado imediatamente para o bloco `catch`, que intercepta o erro e define como a aplicação deve reagir. O bloco `finally` (opcional) roda sempre, independentemente de ter havido falha ou sucesso.

```typescript
function dividir(a: number, b: number): number {
    try {
        if (b === 0) throw new Error("Divisão por zero não é permitida.");
        return a / b;
    } catch (error) {
        console.error(`Erro capturado: ${(error as Error).message}`);
        return 0;
    } finally {
        console.log("Operação de divisão finalizada.");
    }
}
```

---

**3. Validação Prévia de Dados (Defensiva)**

A função inspeciona a integridade dos parâmetros logo no início. Se os dados não fizerem sentido (ex: letras onde deveriam ser números), a função interrompe o processamento na mesma hora, exibindo um alerta visual ou retornando prematuramente, sem tocar na lógica principal.

```typescript
function processarIdade(idade: number): void {
    if (isNaN(idade) || idade <= 0) {
        console.error("Erro: idade inválida. Informe um valor maior que zero.");
        return;
    }
    console.log("Idade válida:", idade);
}
```

---

## 2ª Questão

**1. Checagem de Retorno**

O maior gargalo dessa abordagem é que o desenvolvedor pode simplesmente esquecer de validar o retorno e o compilador não vai emitir alertas. A aplicação continuará rodando com dados corrompidos. Além disso, se a função já precisa retornar um valor real (como o resultado de uma equação), usar a mesma saída para sinalizar um erro gera confusão (ex: retornar `-1` significa um erro de sistema ou o resultado matemático real?). Por último, o rastreio desaparece: você não tem um "stack trace" detalhado ou uma mensagem específica de qual foi a raiz do problema.

**2. Utilização de blocos `try-catch`**

Apesar de ser uma ferramenta poderosa, o `try-catch` facilita más práticas. Criar um `catch` genérico que "engole" erros em silêncio esconde bugs críticos que deveriam travar o sistema para serem corrigidos. É comum também usá-lo equivocadamente para gerenciar o fluxo normal do sistema (como verificar se um usuário está no banco de dados), o que suja o código e causa lentidão, pois instanciar um stack trace exige muito da máquina. Em execuções assíncronas (como promessas ou temporizadores), um erro solto não é pego pelo `try-catch` convencional ao redor dele.

**3. Validação Prévia de Dados**

Espalhar checagens manuais por todo o sistema gera código redundante e vulnerável: se você esquecer um único `if` em uma função nova, o erro passa. A manutenção fica caótica, pois as mensagens de aviso não seguem um padrão central. O código perde clareza, ficando afogado em condicionais defensivas que escondem o real propósito da função. Além disso, sem o lançamento de uma exceção, a falha não percorre a pilha de chamadas; a função apenas para de rodar, e quem a chamou pode nem perceber o que deu errado.

---

## 3ª Questão

Na classe `Conta`, o comportamento do método `sacar()` determina que, se o cliente pedir um valor acima do que possui em saldo, a execução não prossegue. Em vez disso, é atirada uma exceção imediata:

```typescript
public sacar(valor: number): void {
    this.validaValor(valor);

    if (valor > this._saldo) {
        throw new Error(
            `Saldo insuficiente! Saldo atual: R$ ${this._saldo.toFixed(2)}, ` +
            `tentativa de saque: R$ ${valor.toFixed(2)}.`
        );
    }
    this._saldo -= valor;
}
```

Imagine que Alice tente fazer a operação `contaA.transferir(800, contaB)`, mas seu limite é de apenas R$ 500,00. O processo de `transferir()` precisa obrigatoriamente chamar o `sacar(800)` primeiro. Sendo 800 superior a 500, a exceção "explode" **antes** que qualquer centavo seja debitado. A função `transferir()` morre ali mesmo, o dinheiro não sai da origem e não entra no destino. Isso garante que as operações de transferência sejam **atômicas**: ou ocorrem por inteiro com sucesso, ou são canceladas mantendo o estado inicial intacto.

---

## 4ª Questão

Se forçarmos uma transferência astronômica via interface (`App`), o sistema se comporta assim:

```text
Informe o número da conta origem: 111-1
Informe o número da conta destino: 222-2
Digite o valor a ser transferido: 9999
Saldo insuficiente! Saldo atual: R$ 300.00, tentativa de saque: R$ 9999.00.

Transferência falhou!
Operação Finalizada!
```

O bloco no controlador do menu atua como a rede de segurança final:

```typescript
private handleTransfer(): void {
    const originAccount = getText("Informe o número da conta origem: ");
    const destinationAccount = getText("Informe o número da conta destino: ");
    const value = getNumber("Digite o valor a ser transferido: ");

    try {
        this._bank.transferBank(value, originAccount, destinationAccount);
        console.log("Transferência realizada com sucesso!");
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
            console.log("Transferência falhou!");
        }
    }
}
```

A exceção nasce lá no fundo, em `Conta.sacar()`, é repassada pelo `Conta.transferir()`, voa pelo `Banco.transferir()` e só aterrissa no `App.menu()`, onde o `catch` está posicionado. Nenhuma dessas camadas intermediárias teve que se preocupar em capturar o erro — o TypeScript eleva a falha pela pilha de execução sozinho.

**Análise de segurança:** O design atual atende muito bem aos requisitos do cenário. Graças ao `throw` preventivo, é impossível corromper os dados (como debitar a conta origem e falhar no meio do caminho antes de creditar o destino). Tratar as exceções na camada mais externa (App) evita repetição de lógica visual. A única evolução recomendada (já visível na Parte 2 do código) é abandonar os objetos de erro genéricos (`new Error`) e adotar classes especializadas (ex: `SaldoInsuficienteError`), permitindo tratamentos diferenciados dependendo do tipo da falha.

---

## 5ª Questão

Para evitar código duplicado, a classe `Conta` ganhou o método `validaValor(valor)`. Ele proíbe números negativos, zerados ou tipos inválidos, servindo como um escudo chamado durante o **construtor**, no **`sacar()`** e no **`depositar()`**:

```typescript
public validaValor(valor: number): void {
    if (isNaN(valor) || typeof valor !== "number") {
        throw new Error(`Valor inválido: "${valor}" não é um número.`);
    }
    if (valor <= 0) {
        throw new Error(
            `Valor inválido: ${valor}. O valor deve ser maior que zero.`
        );
    }
}
```

Em contrapartida, na
