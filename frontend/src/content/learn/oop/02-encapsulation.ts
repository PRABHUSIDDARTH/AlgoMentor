import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'encapsulation',
  title: 'Encapsulation',
  minutes: 8,
  hook: 'A shop\'s checkout shows an account balance of minus four million, and nobody can say how. `balance` was a public field, so any of sixty call sites could have written it. Encapsulation puts the rules about a value in the one place that owns it, so a wrong number has a short list of suspects.',
  keyPoints: [
    'Encapsulation keeps fields private and lets callers change them only through methods that enforce the rules.',
    'An invariant is a fact that must hold between method calls, such as a balance never going negative.',
    'A setter for every field is still an open door. Prefer methods named for what the object does, like withdraw.',
    'Never hand out a reference to an internal collection. Return a copy or an unmodifiable view.',
  ],
  body: `## Hide the data, expose the behaviour

**Encapsulation** means an object keeps its fields private and lets the outside world change them only through methods that protect its rules.

If \`balance\` on a bank account is public, any code anywhere can set it to minus a million. If it is private and changed only through \`deposit()\` and \`withdraw()\`, the account can refuse an overdraft in one place. Every rule about the balance lives next to the balance.

## The rules an object protects are its invariants

An **invariant** is something that must always be true of an object between method calls: a balance is never negative, a date range ends after it starts, a shopping cart's total equals the sum of its lines. Encapsulation exists to protect invariants. The constructor establishes them, and every public method must leave them true when it returns.

> [!KEY] Name the invariant first
> Before you decide what is private, write down what must always be true of the object. Each invariant tells you which fields to hide and which methods must check their input. If you cannot name one, you may only need a plain data record.

When you can name the invariants of a class, you know which fields must be private and which methods must check their inputs. When you can't name any, the class is probably just a bag of data, and that is fine for a plain record type.

## Access modifiers

Languages give you tools to enforce the boundary:

- **private**: visible only inside the class. The default choice for fields.
- **protected**: visible to subclasses as well. Use it rarely, because every subclass becomes a place that can break your invariants.
- **public**: part of the class's contract with the world.

Python has no enforced private members. By convention a leading underscore (\`_balance\`) means "internal, don't touch", and properties let you put a method behind what looks like a field.

> [!TRY] How private is _balance?
> Does the last line raise an error?
>
> \`\`\`python
> class Account:
>     def __init__(self):
>         self._balance = 100
>
> a = Account()
> a._balance = -50
> print(a._balance)
> \`\`\`
>
> ---
>
> No, it prints \`-50\`. The underscore is a convention that asks callers to stay out; Python does not enforce it. To make the rule real, keep callers on a method or a property setter that checks the value.

## Getters and setters are not automatically encapsulation

A private field with a public setter for every field is still an open door. \`setBalance(-1000000)\` is no safer than a public field. Prefer methods named after what the object *does* (\`withdraw\`) over methods that just poke its data (\`setBalance\`).

Getters deserve a second look too. Returning a reference to an internal list lets the caller add to it behind your back. Return an unmodifiable view or a copy instead.

> [!GOTCHA] The getter that leaks
> A getter that returns the internal list lets any caller add or remove items and skip every check you wrote. The field is private, yet it is public in practice. In Java return \`List.copyOf(items)\` or \`Collections.unmodifiableList(items)\`; in C++ return a const reference or a copy.

## Tell, don't ask

A useful rule of thumb: tell objects what to do instead of asking for their data and deciding for them. Compare \`if (account.getBalance() >= amount) account.setBalance(account.getBalance() - amount)\` with \`account.withdraw(amount)\`. The second keeps the decision inside the object that owns the data, so it can't be made differently in two places.

## Why it pays off

Encapsulation makes change cheap. If callers depend only on \`withdraw\` and \`balance()\`, you can switch the internal representation from an integer of cents to a list of transactions without touching a single caller. It also makes bugs local: when the balance is wrong, there are only a few methods that could have changed it.

In interviews, encapsulation shows up whenever you design a class. Make fields private by default, expose behaviour, and say out loud which invariant each method protects.

> [!INTERVIEW] Getters and setters on trial
> A common prompt is whether a class with private fields and a getter and setter for each one is encapsulated. The expected answer is no, with the reason: the setter can still break an invariant. Show one method that refuses a bad state, such as a \`withdraw\` that rejects an overdraft.`,
  code: {
    java: `import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class BankAccount {
    private long balanceCents;
    private final List<String> history = new ArrayList<>();

    public void deposit(long cents) {
        if (cents <= 0) throw new IllegalArgumentException("deposit must be positive");
        balanceCents += cents;
        history.add("deposit " + cents);
    }

    public void withdraw(long cents) {
        if (cents <= 0) throw new IllegalArgumentException("withdrawal must be positive");
        if (cents > balanceCents) throw new IllegalStateException("insufficient funds");
        balanceCents -= cents;
        history.add("withdraw " + cents);
    }

    public long balanceCents() {
        return balanceCents;
    }

    public List<String> history() {
        return Collections.unmodifiableList(history);
    }
}`,
    python: `class BankAccount:
    def __init__(self) -> None:
        self._balance_cents = 0
        self._history: list[str] = []

    @property
    def balance_cents(self) -> int:
        return self._balance_cents

    def deposit(self, cents: int) -> None:
        if cents <= 0:
            raise ValueError("deposit must be positive")
        self._balance_cents += cents
        self._history.append(f"deposit {cents}")

    def withdraw(self, cents: int) -> None:
        if cents <= 0:
            raise ValueError("withdrawal must be positive")
        if cents > self._balance_cents:
            raise ValueError("insufficient funds")
        self._balance_cents -= cents
        self._history.append(f"withdraw {cents}")

    def history(self) -> tuple[str, ...]:
        return tuple(self._history)`,
    cpp: `#include <stdexcept>
#include <string>
#include <vector>

class BankAccount {
public:
    void deposit(long long cents) {
        if (cents <= 0) throw std::invalid_argument("deposit must be positive");
        balanceCents_ += cents;
        history_.push_back("deposit " + std::to_string(cents));
    }

    void withdraw(long long cents) {
        if (cents <= 0) throw std::invalid_argument("withdrawal must be positive");
        if (cents > balanceCents_) throw std::logic_error("insufficient funds");
        balanceCents_ -= cents;
        history_.push_back("withdraw " + std::to_string(cents));
    }

    long long balanceCents() const { return balanceCents_; }
    const std::vector<std::string>& history() const { return history_; }

private:
    long long balanceCents_ = 0;
    std::vector<std::string> history_;
};`,
  },
  quiz: [
    { id: 'en-1', prompt: 'What is the main goal of encapsulation?', options: ['Letting an object protect its own rules by controlling access to its data', 'Making code run faster', 'Avoiding the use of classes', 'Sharing fields between all objects'], answer: 0, why: 'Private data plus behaviour-revealing methods means invariants are enforced in one place.' },
    { id: 'en-2', prompt: 'A class has private fields and a public setter for every field. Is it well encapsulated?', options: ['Yes, the fields are private', 'Not really: any caller can still put it into any state', 'Yes, setters are always safe', 'Only if it also has getters'], answer: 1, why: 'Unrestricted setters expose the state just as much as public fields do.' },
    { id: 'en-3', prompt: 'Which method best fits an encapsulated BankAccount?', options: ['setBalance(long)', 'getBalanceField()', 'withdraw(long amount)', 'balanceRef()'], answer: 2, why: 'withdraw names a behaviour and can check the rule (no overdraft) before changing state.' },
    { id: 'en-4', prompt: 'A getter returns the object\'s internal ArrayList directly. What is the risk?', options: ['None, getters are read-only', 'It will not compile', 'The list will be garbage collected', 'Callers can modify the list and bypass the class\'s rules'], answer: 3, why: 'Returning a mutable internal reference leaks state; return an unmodifiable view or a copy.' },
    { id: 'en-5', prompt: 'What is an invariant?', options: ['A condition that must hold for an object between method calls', 'A variable that never changes type', 'A method with no parameters', 'A constant defined outside any class'], answer: 0, why: 'For example "balance is never negative". Constructors establish invariants; public methods preserve them.' },
  ],
  interview: [
    { q: 'Explain encapsulation with an example.', a: 'A BankAccount keeps its balance private and exposes deposit and withdraw. withdraw refuses to overdraw, so the rule lives in one place and no caller can bypass it.' },
    { q: 'Are getters and setters encapsulation?', a: 'Only partly. They hide the field name, but a setter for every field lets callers set any state, and a getter that returns a mutable collection leaks it. Good encapsulation exposes behaviour that keeps the object valid.' },
    { q: 'What does "tell, don\'t ask" mean?', a: 'Instead of asking an object for its data and making a decision outside it, tell the object what you want done. The decision then lives with the data, so it cannot be made inconsistently in several places.' },
  ],
}

export default lesson
