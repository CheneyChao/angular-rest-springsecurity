package net.dontdrinkandroot.example.angularrestspringsecurity.entity;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;

public enum Role implements GrantedAuthority, Serializable
{
    USER("ROLE_USER"),
    CONTRIBUTOR("ROLE_CONTRIBUTOR"),
    ADMIN("ROLE_ADMIN");

    private String authority;

    Role(String authority)
    {
        this.authority = authority;
    }

    @Override
    public String getAuthority()
    {
        return this.authority;
    }
}
