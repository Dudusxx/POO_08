# __Atividade 8.1__

## 1ª Questão

Dentre as formas de tratamento de erros, as mais comuns além do lançamento de exceções são:

**1 - Verificação por código de retorno**

A função sinaliza sucesso ou falha por meio do seu valor de retorno (ex: `true/false`, `null`, `-1`). Quem chama a função é responsável por verificar o retorno antes de prosseguir.

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

**2 - Tratamento por `try-catch`**

Um bloco `try` envolve o código que pode falhar. Se um erro for lançado, o controle passa imediatamente para o bloco `catch`, que recebe o objeto de erro e pode tratá-lo. O bloco `finally`, quando presente, sempre é executado independente de ter ocorrido erro ou não.

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

**3 - Validação de entrada**

Antes de executar qualquer lógica, a função verifica se os dados recebidos são válidos. Caso não sejam, a execução é interrompida imediatamente, exibindo uma mensagem de erro ou lançando uma exceção.

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

**1. Verificação por código de retorno**

O principal problema é que o chamador pode simplesmente ignorar o valor de retorno sem nenhum aviso do compilador, o código compila e executa normalmente, mas em estado incorreto. Além disso, quando a função já precisa retornar um dado (ex: um número calculado), usar o mesmo retorno para indicar erro gera ambiguidade: um retorno `-1` significa erro ou é um resultado válido? Por fim, o contexto do erro se perde completamente, não há mensagem, não há stack trace, não há distinção entre tipos de falha.

**2. Tratamento por `try-catch`**

O `try-catch` é poderoso, mas convida ao abuso. Um bloco `catch (error)` genérico pode engolir qualquer tipo de exceção, inclusive erros de programação que deveriam ser corrigidos, não silenciados. Outro problema comum é usar `try-catch` para controle de fluxo normal (ex: verificar se um usuário existe), o que torna o código mais difícil de ler e prejudica a performance, pois a criação do stack trace tem custo. Por fim, em código assíncrono, um `throw` dentro de um `setTimeout` ou callback não é capturado por um `try-catch` externo, exigindo tratamento adicional com `Promise` e `.catch()`.

**3. Validação de entrada**

Validar entradas manualmente em cada ponto do sistema é trabalhoso e propenso a inconsistências: basta uma função esquecer de validar para abrir uma brecha. As mensagens de erro ficam espalhadas pelo código sem padronização, o que dificulta a manutenção. Além disso, o fluxo do código fica poluído com condicionais defensivas em vez de expressar a lógica de negócio. Diferentemente das exceções, esse método não interrompe a pilha de chamadas automaticamente, a função apenas retorna cedo, e as camadas acima não são notificadas a menos que o retorno seja explicitamente verificado.

---

## 3ª Questão

O método `sacar()` da classe `Conta` verifica se o valor solicitado é maior que o saldo disponível e, caso seja, lança uma exceção com `throw new Error(...)`:

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

Ao chamar `contaA.transferir(800, contaB)` com Alice tendo apenas R$ 500,00, o método `transferir()` internamente chama `sacar(800)`. Como `800 > 500`, a exceção é lançada **antes** de qualquer alteração de saldo. A execução do método `transferir()` é interrompida imediatamente, o depósito na conta destino nunca ocorre, e ambos os saldos permanecem inalterados. Isso demonstra que a operação de transferência é **atômica neste sentido**: ou executa por completo, ou não altera nada.

---

## 4ª Questão

Ao tentar uma transferência com valor muito acima do saldo a partir do `App`:

```
Informe o número da conta origem: 111-1
Informe o número da conta destino: 222-2
Digite o valor a ser transferido: 9999
Saldo insuficiente! Saldo atual: R$ 300.00, tentativa de saque: R$ 9999.00.

Transferência falhou!
Operação Finalizada!
```

O `try-catch` no método de menu captura a exceção:

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

A exceção é lançada em `Conta.sacar()`, sobe para `Conta.transferir()`, de lá para `Banco.transferir()` e finalmente chega em `App.menu()` onde é capturada. Nenhuma dessas camadas intermediárias precisa de `try-catch` próprio — a exceção percorre a pilha de chamadas automaticamente até encontrar o primeiro `catch` disponível.

**Avaliação de confiabilidade:** a implementação é confiável para o cenário em questão. Como o `throw` em `sacar()` ocorre antes de qualquer débito, a consistência dos dados é preservada, não existe risco de a conta origem ser debitada sem que a destino seja creditada. O tratamento centralizado no `App.menu()` também evita duplicação de lógica de erro. O ponto de atenção é que, em sistemas maiores, lançar apenas `new Error` genérico pode dificultar a distinção entre tipos de falha (ex: saldo insuficiente vs. conta inexistente); o ideal seria criar classes de erro customizadas (`class SaldoInsuficienteError extends Error`).

---

## 5ª Questão

O método `validaValor(valor)` foi adicionado à classe `Conta` para centralizar a validação. Ele lança um erro se o valor for `<= 0` ou não for um número válido (`NaN`), e é chamado no **construtor**, em **`sacar()`** e em **`depositar()`**:

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



A função auxiliar `getNumber` (camada de IO) faz uma primeira barreira rejeitando entradas não numéricas e pedindo nova entrada recursivamente, enquanto `validaValor` cuida da regra de negócio (valor positivo). As duas camadas se complementam:

```typescript
export function getNumber(text: string): number {
    const response = input(text);
    try {
        if (isNaN(Number(response)) || response === "") {
            throw new Error(`Erro: Caractere inválido!\n`);
        }
        return Number(response);
    } catch (error) {
        console.error((error as Error).message);
        return getNumber(text); // pede nova entrada recursivamente
    }
}
```

**Avaliação:** o tratamento ficou bem estruturado em duas camadas distintas. A camada de IO (`getNumber`) garante que só números chegam à lógica de negócio. A camada de domínio (`validaValor`) garante que esses números respeitem as regras do sistema bancário. Isso segue o princípio de responsabilidade única e facilita a manutenção: mudar a regra de negócio não afeta o IO, e vice-versa.
