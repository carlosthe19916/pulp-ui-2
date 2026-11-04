package org.example.hello;

import org.apache.commons.lang3.StringUtils;

public final class Greeter {
  private Greeter() {}

  public static String greet(String name) {
    return "Hello, " + StringUtils.capitalize(name) + "!";
  }
}
