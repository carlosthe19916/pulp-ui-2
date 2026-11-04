package org.example.hello;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class GreeterTest {
  @Test
  void capitalizesTheName() {
    assertEquals("Hello, Pulp!", Greeter.greet("pulp"));
  }
}
