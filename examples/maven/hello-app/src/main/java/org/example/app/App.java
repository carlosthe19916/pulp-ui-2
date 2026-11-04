package org.example.app;

import org.example.hello.Greeter;

public class App {
  public static void main(String[] args) {
    System.out.println(Greeter.greet(args.length > 0 ? args[0] : "pulp"));
  }
}
