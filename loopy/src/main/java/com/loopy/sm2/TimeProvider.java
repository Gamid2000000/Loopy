package com.loopy.sm2;

import org.joda.time.DateTime;

public interface TimeProvider {
    public DateTime getNow();
}
