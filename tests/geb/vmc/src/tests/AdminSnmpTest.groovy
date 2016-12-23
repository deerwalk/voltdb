/* This file is part of VoltDB.
 * Copyright (C) 2008-2016 VoltDB Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
 * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

 /**
 * Created by anrai on 2/12/15.
 */

package vmcTest.tests

import org.junit.Test
import vmcTest.pages.*
import geb.Page.*

/**
 * This class contains tests of the 'Admin' tab of the VoltDB Management
 * Center (VMC) page, which is the VoltDB (new) web UI.
 */

class AdminSnmpTest extends TestBase {
    def setup() { // called before each test
        int count = 0

        while(count<numberOfTrials) {
            count ++
            try {
                setup: 'Open VMC page'
                to VoltDBManagementCenterPage
                page.loginIfNeeded()
                expect: 'to be on VMC page'
                at VoltDBManagementCenterPage

                when: 'click the Admin link (if needed)'
                page.openAdminPage()
                then: 'should be on Admin page'
                at AdminPage

                break
            } catch (org.openqa.selenium.ElementNotVisibleException e) {
                println("ElementNotVisibleException: Unable to Start the test")
                println("Retrying")
            }
        }
    }

    def checkSnmpTitles() {
        when: 'check snmp title'
        page.snmpTitle.isDisplayed()
        and: 'click snmp title'
        page.snmpTitle.click()
        then: 'check titles under snmp'
        page.snmpTarget.isDisplayed()
        page.snmpCommunity.isDisplayed()
        page.snmpUsername.isDisplayed()
        page.snmpAuthenticationProtocol.isDisplayed()
        page.snmpAuthenticationKey.isDisplayed()
        page.snmpPrivacyProtocol.isDisplayed()
        page.snmpPrivacyKey.isDisplayed()
    }

    def checkSnmpButtons() {
        when: 'check snmp edit button'
        page.snmpEditButton.isDisplayed()
        then: 'click snmp button'
        page.snmpEditButton.click()
    }

    def targetValueNotEmpty() {
        int count = 0
        testStatus = false
        isPro = false
        snmpEnabled = false

        expect: 'at Admin Page'

        when: "check Pro version"
        if (!waitFor(10) { page.snmpTitle.isDisplayed() }) {
            isPro = true
        }
        else{
            assert true
        }
        then: "check SNMP enabled"
        if (isPro == true) {
            if (page.snmpEnabled.value("On")) {
                snmpEnabled = true
            }
        }
        when: "check edit snmp button displayed"
        if (page.editSnmpButton.isDisplayed()) {
            page.edit.SnmpButton.click()
        }
        if (waitFor(10) { page.editSnmpOkButton.isDisplayed() }) {
            page.editSnmpOkButton.click()
        }

        then: "check target validation"
        if (snmpEnabled == true) {
            if (page.errorTarget.isDisplayed()) {
                println("PASS")
            } else {
                println("FAIL: Test didn't pass")
                assert false
            }

        }

    }

    def checkCommunityDefaultValue(){
        when: "click edit button"
            if (page.editSnmpButton.isDisplayed()) {
                page.edit.SnmpButton.click()
            }
        then:
            if(page.txtCommunity.value().equals("public")){
                assert true
            }
            else{
                println("default value for community is not set")
                assert false
            }
    }

    def checkAuthKeyDefaultValue(){
        when: "click edit button"
        if (page.editSnmpButton.isDisplayed()) {
            page.edit.SnmpButton.click()
        }
        then:
        if(page.txtAuthkey.value().equals("defaultauthkey")){
            assert true
        }
        else{
            println("default value for authkey is not set")
            assert false
        }
    }

    def checkPrivKeyDefaultValue(){
        when: "click edit button"
        if (page.editSnmpButton.isDisplayed()) {
            page.edit.SnmpButton.click()
        }
        then:
        if(page.txtPrivkey.value().equals("defaultprivkey")){
            assert true
        }
        else{
            println("default value for privkey is not set")
            assert false
        }

    }
}
