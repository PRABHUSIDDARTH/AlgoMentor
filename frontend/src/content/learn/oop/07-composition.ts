import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'composition',
  title: 'Composition over inheritance',
  minutes: 8,
  diagram: 'composition',
  body: `## Build objects out of objects

**Composition** means an object holds other objects and delegates work to them. A \`Car\` *has an* \`Engine\`, *has* \`Wheels\` and *has a* \`Radio\`. It doesn't inherit from any of them. When you ask the car to start, it asks its engine.

"Favour composition over inheritance" is one of the best-known lines in object-oriented design. It doesn't say inheritance is wrong. It says that when either would work, composition usually ages better.

## Why inheritance gets painful

Inheritance decides behaviour at compile time and couples the child to the parent's internals. Problems pile up as requirements grow:

- **Class explosion.** Suppose notifications can be email or SMS, and urgent or normal. With inheritance you write \`UrgentEmailNotifier\`, \`NormalEmailNotifier\`, \`UrgentSmsNotifier\`, \`NormalSmsNotifier\`. Add push notifications and a "digest" mode and you have nine classes. With composition, a \`Notifier\` holds a \`Channel\` and a \`Priority\`: two small families that combine freely.
- **Fixed at compile time.** An object can't change its parent while running, but it can swap a component. A game character can pick up a new \`Weapon\` object; it can't stop being a subclass of \`Archer\`.
- **Leaking the parent's interface.** Inheriting from \`ArrayList\` to build a \`Playlist\` exposes \`clear()\`, \`removeAll()\` and dozens of other methods that may break the playlist's rules. Holding a private list and exposing only \`add\` and \`next\` keeps the invariants safe.

## Delegation

With composition, the outer object forwards calls to its parts. That is a little more typing than inheritance, which gives you the parent's methods for free, but every forwarded method is a deliberate decision about the object's public surface. Many languages offer shortcuts for repetitive forwarding, but writing it out is often clearer.

## Strategy: composition you will use constantly

Making a behaviour a separate object you plug in is the **Strategy** pattern, and it is composition at its most useful. A \`Sorter\` takes a comparison; a \`ParkingLot\` takes a \`PricingStrategy\`; a \`Checkout\` takes a \`DiscountPolicy\`. Behaviour becomes data that can be chosen at run time, configured, and replaced with a fake in tests.

## Aggregation and composition in UML terms

UML distinguishes two strengths of "has a":

- **Composition** (filled diamond): the part lives and dies with the whole. A \`Room\` exists only inside its \`House\`.
- **Aggregation** (hollow diamond): the part can outlive the whole or be shared. A \`Team\` has \`Players\` who exist without it.

In code the difference shows up in who creates and owns the part, which matters most in C++, where ownership decides who frees memory: a \`std::unique_ptr\` member says composition; a reference or \`std::shared_ptr\` says shared ownership.

## When inheritance is still right

Use inheritance when the "is a" relationship is real, substitution holds, and the hierarchy is shallow and stable: \`IOException\` extends \`Exception\`, a framework's \`AbstractController\` you are meant to extend. Use composition for everything that varies independently, for behaviour you want to swap, and whenever you are tempted to inherit only to reuse a few methods.`,
  code: {
    java: `public interface Channel {
    void deliver(String to, String text);
}

class EmailChannel implements Channel {
    public void deliver(String to, String text) {
        System.out.println("email to " + to + ": " + text);
    }
}

class SmsChannel implements Channel {
    public void deliver(String to, String text) {
        System.out.println("sms to " + to + ": " + text);
    }
}

enum Priority {
    NORMAL, URGENT;

    String format(String text) {
        return this == URGENT ? "[URGENT] " + text : text;
    }
}

// Composition: 2 channels x 2 priorities without 4 subclasses.
class Notifier {
    private Channel channel;
    private final Priority priority;

    Notifier(Channel channel, Priority priority) {
        this.channel = channel;
        this.priority = priority;
    }

    void switchChannel(Channel next) {
        this.channel = next; // behaviour can change at run time
    }

    void send(String to, String text) {
        channel.deliver(to, priority.format(text));
    }
}`,
    python: `from typing import Protocol


class Channel(Protocol):
    def deliver(self, to: str, text: str) -> None: ...


class EmailChannel:
    def deliver(self, to: str, text: str) -> None:
        print(f"email to {to}: {text}")


class SmsChannel:
    def deliver(self, to: str, text: str) -> None:
        print(f"sms to {to}: {text}")


class Notifier:
    def __init__(self, channel: Channel, urgent: bool = False) -> None:
        self.channel = channel
        self.urgent = urgent

    def notify(self, to: str, text: str) -> None:
        self.channel.deliver(to, f"[URGENT] {text}" if self.urgent else text)


class Playlist:
    """Holds a list instead of inheriting from list, so only safe operations are exposed."""

    def __init__(self) -> None:
        self._songs: list[str] = []

    def add(self, song: str) -> None:
        if song not in self._songs:
            self._songs.append(song)

    def next(self) -> str | None:
        return self._songs.pop(0) if self._songs else None`,
    cpp: `#include <iostream>
#include <memory>
#include <string>
#include <utility>

class Channel {
public:
    virtual ~Channel() = default;
    virtual void deliver(const std::string& to, const std::string& text) = 0;
};

class EmailChannel : public Channel {
public:
    void deliver(const std::string& to, const std::string& text) override { std::cout << "email to " << to << ": " << text << '\\n'; }
};

class SmsChannel : public Channel {
public:
    void deliver(const std::string& to, const std::string& text) override { std::cout << "sms to " << to << ": " << text << '\\n'; }
};

class Notifier {
public:
    Notifier(std::unique_ptr<Channel> channel, bool urgent) : channel_(std::move(channel)), urgent_(urgent) {}

    void switchChannel(std::unique_ptr<Channel> next) { channel_ = std::move(next); }

    void notify(const std::string& to, const std::string& text) {
        channel_->deliver(to, urgent_ ? "[URGENT] " + text : text);
    }

private:
    std::unique_ptr<Channel> channel_;  // owned part: composition
    bool urgent_;
};`,
  },
  quiz: [
    { id: 'cp-1', prompt: 'A Car has an Engine. Which relationship is this?', options: ['Inheritance', 'Composition', 'Overloading', 'Interface segregation'], answer: 1, why: '"Has a" relationships are modelled by holding the part as a field and delegating to it.' },
    { id: 'cp-2', prompt: 'Notifications vary by channel (email, SMS, push) and priority (normal, urgent). Why does composition beat inheritance here?', options: ['Inheritance would need a subclass for every combination', 'Composition is faster at run time', 'Inheritance cannot have constructors', 'Composition avoids interfaces'], answer: 0, why: 'Independent dimensions multiply as subclasses; as components they combine freely.' },
    { id: 'cp-3', prompt: 'A Playlist class extends ArrayList. What is the main risk?', options: ['It will be slower', 'It exposes list operations (clear, removeAll) that can break the playlist\'s rules', 'ArrayList is final', 'It cannot be iterated'], answer: 1, why: 'Inheriting publishes the parent\'s whole interface; composition exposes only what you choose.' },
    { id: 'cp-4', prompt: 'In UML, a filled diamond means:', options: ['Aggregation: the part can outlive the whole', 'Composition: the part lives and dies with the whole', 'Inheritance', 'An interface'], answer: 1, why: 'Filled diamond is composition (strong ownership); hollow diamond is aggregation.' },
    { id: 'cp-5', prompt: 'Which pattern plugs a behaviour object into a class so it can be swapped at run time?', options: ['Singleton', 'Strategy', 'Factory', 'Observer'], answer: 1, why: 'Strategy is composition of behaviour: the host delegates to an interchangeable strategy object.' },
  ],
  interview: [
    { q: 'Why favour composition over inheritance?', a: 'Composition couples objects only through interfaces, lets behaviour change at run time, avoids an explosion of subclasses for independent variations, and exposes only the methods you choose. Inheritance is fixed at compile time and couples children to parent internals.' },
    { q: 'What is the difference between aggregation and composition?', a: 'Both are "has a". In composition the part\'s lifetime is owned by the whole (a room in a house); in aggregation the part exists independently and may be shared (players in a team).' },
    { q: 'When would you still choose inheritance?', a: 'When there is a true "is a" relationship, substitution holds, and the hierarchy is shallow and stable, for example exception types or a framework base class designed for extension.' },
  ],
}

export default lesson
